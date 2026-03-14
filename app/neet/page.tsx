"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import NoticeBoard from '../components/NoticeBoard'
import Leaderboard from '../components/Leaderboard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [liveStatuses, setLiveStatuses] = useState<Record<string, boolean>>({})
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null)
  
  // Dual Upload States
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (!supabase || !session?.user?.email) return;

    const fetchData = async () => {
      const { data: statuses } = await supabase.from('class_status').select('*')
      if (statuses) setLiveStatuses(statuses.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.is_live }), {}))

      const { data: enrolls } = await supabase.from('enrollments').select('batch_id').eq('student_email', session.user.email)
      if (enrolls) setEnrolledBatches(enrolls.map(e => e.batch_id))

      const { data: mats } = await supabase.from('materials').select('*').eq('category', 'neet').order('created_at', { ascending: false })
      if (mats) setMaterials(mats)
    }

    fetchData()
    const channel = supabase.channel('lms-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  // --- LOGIC FUNCTIONS ---

  const handleEnroll = async (batchId: string) => {
    if (!supabase || !session?.user?.email) return alert("Please sign in to enroll");
    const { error } = await supabase.from('enrollments').insert([{ student_email: session.user.email, batch_id: batchId }]);
    if (error) alert("Enrollment failed.");
    else setEnrolledBatches(prev => [...prev, batchId]);
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!supabase || (!selectedVideo && !selectedNotes)) return alert("Please add at least one file");
    
    setUploadProgress(10);
    const formData = new FormData(e.target);
    const subject = formData.get('subject');
    const title = formData.get('title');

    try {
      let videoUrl = null;
      let notesUrl = null;

      if (selectedVideo) {
        const vPath = `neet/${showUploadModal}/${subject}/v_${Date.now()}.${selectedVideo.name.split('.').pop()}`;
        await supabase.storage.from('batch-materials').upload(vPath, selectedVideo);
        videoUrl = supabase.storage.from('batch-materials').getPublicUrl(vPath).data.publicUrl;
      }

      if (selectedNotes) {
        const nPath = `neet/${showUploadModal}/${subject}/n_${Date.now()}.${selectedNotes.name.split('.').pop()}`;
        await supabase.storage.from('batch-materials').upload(nPath, selectedNotes);
        notesUrl = supabase.storage.from('batch-materials').getPublicUrl(nPath).data.publicUrl;
      }

      await supabase.from('materials').insert([{
        batch_id: showUploadModal,
        subject,
        title,
        video_url: videoUrl,
        notes_url: notesUrl,
        category: 'neet'
      }]);

      alert("Upload Complete!");
      setShowUploadModal(null);
      setSelectedVideo(null);
      setSelectedNotes(null);
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploadProgress(0);
    }
  };

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!supabase) return;
    setLiveStatuses(prev => ({ ...prev, [batchId]: !currentStatus }));
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!supabase || !confirm("Delete this material?")) return;
    await supabase.from('materials').delete().eq('id', id);
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading NEET Portal...</div>

  const batches = [
    { id: "ultimate-2026", name: "Yakeen NEET 2026", color: "#6c63ff", originalPrice: "6,000", starts: "14 Apr, 2026" },
    { id: "crash-course", name: "NEET Crash Course 2026", color: "#ff4ecd", originalPrice: "5,500", starts: "15 May, 2026" }
  ]

  const isAnyBatchUnlocked = enrolledBatches.length > 0 || isOwner;
  const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' };
  const tileStyle = { background: '#fff', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #f0f0f0' };

  return (
    <div style={{ padding: '40px 5%', background: '#f5f7fb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SEPARATE DUAL UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleUpload} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '480px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{margin:0}}>Add to {batches.find(b => b.id === showUploadModal)?.name}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="subject" required style={{...inputStyle, flex: 1}}><option>Physics</option><option>Chemistry</option><option>Biology</option></select>
              <input name="title" placeholder="Topic Name" required style={{...inputStyle, flex: 2}} />
            </div>

            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) setSelectedVideo(e.dataTransfer.files[0]) }}
              style={{ border: '2px dashed #6c63ff', padding: '20px', borderRadius: '15px', textAlign: 'center', background: '#f8f9ff', cursor: 'pointer' }}
              onClick={() => document.getElementById('vIn')?.click()}>
              <input type="file" id="vIn" hidden accept="video/*" onChange={(e) => e.target.files && setSelectedVideo(e.target.files[0])} />
              <div style={{fontSize:'13px', fontWeight:'bold', color:'#6c63ff'}}>🎥 {selectedVideo ? selectedVideo.name : "Drop Video Recording"}</div>
            </div>

            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) setSelectedNotes(e.dataTransfer.files[0]) }}
              style={{ border: '2px dashed #ff4ecd', padding: '20px', borderRadius: '15px', textAlign: 'center', background: '#fff0f9', cursor: 'pointer' }}
              onClick={() => document.getElementById('nIn')?.click()}>
              <input type="file" id="nIn" hidden accept=".pdf" onChange={(e) => e.target.files && setSelectedNotes(e.target.files[0])} />
              <div style={{fontSize:'13px', fontWeight:'bold', color:'#ff4ecd'}}>📄 {selectedNotes ? selectedNotes.name : "Drop PDF Notes"}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => {setShowUploadModal(null); setSelectedVideo(null); setSelectedNotes(null);}} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#6c63ff', color: 'white', border: 'none', fontWeight:'bold' }}>Upload Both</button>
            </div>
          </form>
        </div>
      )}

      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div><h1>NEET Study Portal</h1><Link href="/" style={{color:'#6c63ff', textDecoration:'none'}}>← Home</Link></div>
        {isOwner && <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>Faculty Mode Active</div>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: isAnyBatchUnlocked ? '1fr 320px 320px' : '1fr', gap: '30px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {batches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
            return (
              <div key={batch.id} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                <div style={{ height: '80px', background: batch.color, padding: '0 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0 }}>{batch.name}</h2>
                  {isEnrolled && liveStatuses[batch.id] && <span style={{fontWeight:'bold', background:'rgba(0,0,0,0.2)', padding:'5px 12px', borderRadius:'20px', fontSize:'12px'}}>● LIVE NOW</span>}
                </div>

                <div style={{ padding: '24px' }}>
                  {!isEnrolled ? (
                    /* MARKETPLACE VIEW */
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>🎓 For NEET Aspirants | 📅 Starts: {batch.starts}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>FREE</span>
                        <span style={{ textDecoration: 'line-through', color: '#999' }}>₹{batch.originalPrice}</span>
                        <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '14px' }}>100% OFF</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${batch.color}`, color: batch.color, background: 'white', fontWeight: 'bold' }}>EXPLORE</button>
                        <button onClick={() => handleEnroll(batch.id)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: batch.color, color: 'white', fontWeight: 'bold', cursor:'pointer' }}>ENROLL NOW</button>
                      </div>
                    </div>
                  ) : (
                    /* DASHBOARD INSIDE VIEW */
                    <div>
                      <h4 style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>Batch Offerings</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                        <div style={tileStyle}>📚 All Classes</div>
                        <div style={tileStyle}>📝 All Tests</div>
                        <div style={tileStyle}>❓ My Doubts</div>
                        <div style={tileStyle}>👥 Community</div>
                      </div>

                      {liveStatuses[batch.id] && (
                        <div style={{ background: '#f8f9ff', padding: '15px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 'bold' }}>🕒 UPCOMING EVENTS (1)</div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Lecture • Live Session</div>
                          </div>
                          <button style={{ padding: '8px 20px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight:'bold', cursor:'pointer' }}>Join</button>
                        </div>
                      )}

                      <h4 style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>Study Zone</h4>
                      {['Physics', 'Chemistry', 'Biology'].map(sub => (
                        <details key={sub} open style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                          <summary style={{ fontWeight: 'bold', color: batch.color, cursor: 'pointer', outline: 'none' }}>📂 {sub}</summary>
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {materials.filter(m => m.batch_id === batch.id && m.subject === sub).map(m => (
                              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f9f9fb', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                                <span>{m.title}</span>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                  {m.video_url && <a href={m.video_url} target="_blank" style={{textDecoration:'none'}}>🎥</a>}
                                  {m.notes_url && <a href={m.notes_url} target="_blank" style={{textDecoration:'none'}}>📄</a>}
                                  {isOwner && <button onClick={() => handleDeleteMaterial(m.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'12px'}}>🗑️</button>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}

                      {isOwner && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                          <button onClick={() => toggleClassStatus(batch.id, liveStatuses[batch.id])} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: liveStatuses[batch.id] ? '#ff4757' : batch.color, color: 'white', border: 'none', fontWeight: 'bold', cursor:'pointer' }}>{liveStatuses[batch.id] ? "End Session" : "Go Live"}</button>
                          <button onClick={() => setShowUploadModal(batch.id)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px dashed #6c63ff', color: '#6c63ff', background: 'none', fontWeight:'bold', cursor:'pointer' }}>+ Upload Content</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isAnyBatchUnlocked && (
          <div style={{display:'flex', flexDirection:'column', gap:'25px'}}>
            <NoticeBoard category="neet" isOwner={isOwner} />
            <Leaderboard category="neet" />
          </div>
        )}
      </div>
    </div>
  )
}