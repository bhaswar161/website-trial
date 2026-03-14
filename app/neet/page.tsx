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
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  // --- HELPER FUNCTIONS ---

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!supabase) return;
    setLiveStatuses(prev => ({ ...prev, [batchId]: !currentStatus }));
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId);
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!supabase || !selectedFile) return alert("Please drop or select a file first");
    
    setUploadProgress(10);
    const formData = new FormData(e.target);
    const subject = formData.get('subject');
    const title = formData.get('title');

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `neet/${showUploadModal}/${subject}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('batch-materials')
      .upload(filePath, selectedFile);

    if (uploadError) return alert("Storage Upload Failed");
    setUploadProgress(60);

    const { data: { publicUrl } } = supabase.storage.from('batch-materials').getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('materials').insert([{
      batch_id: showUploadModal,
      subject,
      title,
      video_url: selectedFile.type.includes('video') ? publicUrl : null,
      notes_url: selectedFile.type.includes('pdf') ? publicUrl : null,
      category: 'neet'
    }]);

    if (dbError) alert("Database Entry Failed");
    else {
      setShowUploadModal(null);
      setSelectedFile(null);
      setUploadProgress(0);
      alert("Subject material successfully uploaded!");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!supabase || !confirm("Delete this recording/note?")) return;
    await supabase.from('materials').delete().eq('id', id);
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading NEET Portal...</div>

  const batches = [
    { 
        id: "ultimate-2026", 
        name: "Yakeen NEET 2026", 
        color: "#6c63ff", 
        starts: "14 Apr, 2026", 
        price: "4,800", 
        originalPrice: "6,000",
        discount: "20%"
    },
    { 
        id: "crash-course", 
        name: "NEET Crash Course 2026", 
        color: "#ff4ecd", 
        starts: "15 May, 2026", 
        price: "3,499", 
        originalPrice: "5,500",
        discount: "36%"
    }
  ]

  const isAnyBatchUnlocked = enrolledBatches.length > 0 || isOwner;
  const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' };

  return (
    <div style={{ padding: '40px 5%', background: '#f5f7fb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleUpload} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '450px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Add to {batches.find(b => b.id === showUploadModal)?.name}</h3>
            <select name="subject" required style={inputStyle}>
              <option>Physics</option><option>Chemistry</option><option>Biology</option>
            </select>
            <input name="title" placeholder="Topic Name" required style={inputStyle} />
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]); }}
              style={{ border: `2px dashed ${isDragging ? '#6c63ff' : '#ccc'}`, padding: '30px', borderRadius: '15px', textAlign: 'center', background: isDragging ? '#f0f0ff' : '#fafafa', cursor: 'pointer' }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input type="file" id="fileInput" hidden onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
              {selectedFile ? `✅ ${selectedFile.name}` : "Drag & Drop Video or PDF here"}
            </div>
            {uploadProgress > 0 && <div style={{height:'4px', width:`${uploadProgress}%`, background:'#6c63ff', borderRadius:'2px'}} />}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => {setShowUploadModal(null); setSelectedFile(null);}} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#6c63ff', color: 'white', border: 'none', fontWeight:'bold' }}>Upload Now</button>
            </div>
          </form>
        </div>
      )}

      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ color: '#333', fontSize: '2rem', margin: 0 }}>NEET Study Portal</h1>
            <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
        </div>
        {isOwner && <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', background: '#e8f5e9', padding: '5px 12px', borderRadius: '20px' }}>Faculty Mode</div>}
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isAnyBatchUnlocked ? '1fr 320px 320px' : '1fr', 
        gap: '30px', 
        alignItems: 'start' 
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
            {batches.map((batch) => {
                const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
                
                return (
                <div key={batch.id} style={{ 
                    background: '#fff', 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    border: '1px solid #eee'
                }}>
                    <div style={{ height: '160px', background: batch.color, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold' }}>ONLINE</div>
                        <h2 style={{ color: '#fff', textAlign: 'center', padding: '20px', margin: 0 }}>{batch.name}</h2>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '12px', color: '#666', background: '#f0f0f0', padding: '3px 10px', borderRadius: '12px' }}>Hinglish</span>
                            {isEnrolled && liveStatuses[batch.id] && <span style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '13px' }}>● LIVE NOW</span>}
                        </div>

                        {!isEnrolled ? (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '14px', color: '#444', marginBottom: '5px' }}>🎓 For NEET Aspirants</div>
                                    <div style={{ fontSize: '14px', color: '#444' }}>📅 Starts: {batch.starts}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>₹{batch.price}</span>
                                    <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#999' }}>₹{batch.originalPrice}</span>
                                    <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>{batch.discount} OFF</span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${batch.color}`, background: 'white', color: batch.color, fontWeight: 'bold', cursor: 'pointer' }}>EXPLORE</button>
                                    <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: batch.color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>BUY NOW</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                    {['Physics', 'Chemistry', 'Biology'].map(sub => (
                                        <details key={sub} open style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '10px' }}>
                                            <summary style={{ fontWeight: 'bold', color: batch.color, cursor: 'pointer', outline: 'none' }}>{sub}</summary>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                                {materials.filter(m => m.batch_id === batch.id && m.subject === sub).map(m => (
                                                    <div key={m.id} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9ff', padding: '8px 12px', borderRadius: '8px' }}>
                                                        <span>{m.title}</span>
                                                        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                                          <a href={m.video_url || m.notes_url} target="_blank" style={{ textDecoration: 'none' }}>{m.video_url ? '🎥' : '📄'}</a>
                                                          {isOwner && <button onClick={() => handleDeleteMaterial(m.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px'}}>🗑️</button>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {materials.filter(m => m.batch_id === batch.id && m.subject === sub).length === 0 && <span style={{fontSize: '11px', color: '#999'}}>No uploads yet</span>}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                                
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button 
                                        onClick={() => isOwner && toggleClassStatus(batch.id, liveStatuses[batch.id])} 
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: liveStatuses[batch.id] ? '#ff4757' : '#333', color: '#fff', fontWeight: 'bold' }}>
                                        {isOwner ? (liveStatuses[batch.id] ? "End Live Session" : "Start Live Session") : (liveStatuses[batch.id] ? "Join Class" : "Class Offline")}
                                    </button>
                                    {isOwner && <button onClick={() => setShowUploadModal(batch.id)} style={{ padding: '10px', border: '1px dashed #6c63ff', borderRadius: '10px', color: '#6c63ff', background: 'none', cursor: 'pointer' }}>+ Add Subject Content</button>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                )
            })}
          </div>
        </div>

        {isAnyBatchUnlocked && (
          <>
            <NoticeBoard category="neet" isOwner={isOwner} />
            <Leaderboard category="neet" />
          </>
        )}
      </div>
    </div>
  )
}