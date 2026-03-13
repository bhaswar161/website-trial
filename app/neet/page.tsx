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
  
  // --- LMS STATES ---
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null)

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (!supabase || !session?.user?.email) return;

    const fetchData = async () => {
      // 1. Fetch Class Status
      const { data: statuses } = await supabase.from('class_status').select('*')
      if (statuses) {
        setLiveStatuses(statuses.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.is_live }), {}))
      }

      // 2. Fetch Student Enrollments
      const { data: enrolls } = await supabase.from('enrollments').select('batch_id').eq('student_email', session.user.email)
      if (enrolls) setEnrolledBatches(enrolls.map(e => e.batch_id))

      // 3. Fetch Subject Materials
      const { data: mats } = await supabase.from('materials').select('*').eq('category', 'neet').order('created_at', { ascending: false })
      if (mats) setMaterials(mats)
    }

    fetchData()

    const channel = supabase.channel('lms-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!supabase) return;
    setLiveStatuses(prev => ({ ...prev, [batchId]: !currentStatus }));
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId);
  };

  const handleJoinClass = async (roomBaseName: string) => {
    try {
      if (!isOwner && supabase && session?.user?.email) {
        const { data: existing } = await supabase.from('leaderboard').select('points').eq('email', session.user.email).single();
        await supabase.from('leaderboard').upsert({
          email: session.user.email,
          full_name: `${localStorage.getItem("userFirstName") || ""} ${localStorage.getItem("userLastName") || ""}`.trim() || session.user.name,
          profile_pic: localStorage.getItem("userProfilePic") || "",
          batch: 'neet',
          points: (existing?.points || 0) + 10
        }, { onConflict: 'email' });
      }

      const today = new Date().toISOString().split('T')[0]; 
      const roomName = `${roomBaseName}_${today}`;
      const response = await fetch('/api/jitsi-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, isOwner })
      });
      const data = await response.json();
      const appId = process.env.NEXT_PUBLIC_JITSI_APP_ID;
      if (!appId || data.error) return alert("Connection Error");

      window.open(`https://8x8.vc/${appId}/${roomName}?jwt=${data.token}`, '_blank', 'noopener,noreferrer');
    } catch (err) { alert("Failed to connect"); }
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!supabase) return;
    const formData = new FormData(e.target);
    const { error } = await supabase.from('materials').insert([{
      batch_id: showUploadModal,
      subject: formData.get('subject'),
      title: formData.get('title'),
      video_url: formData.get('video'),
      notes_url: formData.get('notes'),
      category: 'neet'
    }]);
    if (error) alert("Upload Failed");
    else {
      setShowUploadModal(null);
      alert("Material Uploaded!");
    }
  };

  // --- NEW: DELETE HANDLER ---
  const handleDeleteMaterial = async (id: string) => {
    if (!supabase || !confirm("Are you sure you want to delete this material?")) return;
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) alert("Delete Failed");
    else alert("Material Removed");
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Portal...</div>

  const batches = [
    { id: "ultimate-2026", name: "NEET 2026 Ultimate Batch", color: "#6c63ff", roomName: "StudyHub_Ultimate_Bhaswar" },
    { id: "crash-course", name: "NEET Crash Course", color: "#ff4ecd", roomName: "StudyHub_Crash_Bhaswar" }
  ]

  return (
    <div style={{ padding: '40px 5%', fontFamily: 'sans-serif', background: '#f5f7fb', minHeight: '100vh' }}>
      
      {/* Faculty Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleUpload} style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Upload Material</h3>
            <select name="subject" required style={inputStyle}><option>Physics</option><option>Chemistry</option><option>Biology</option></select>
            <input name="title" placeholder="Topic Title (e.g. Kinematics L1)" required style={inputStyle} />
            <input name="video" placeholder="Recording URL (YouTube/Drive)" style={inputStyle} />
            <input name="notes" placeholder="Notes URL (PDF Link)" style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowUploadModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#6c63ff', color: 'white', border: 'none' }}>Upload</button>
            </div>
          </form>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Home</Link>
          <h1 style={{ color: '#333' }}>NEET Study Portal</h1>
        </div>
        {isOwner && <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>Faculty Mode</div>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 320px', gap: '25px', alignItems: 'start' }}>
        
        {/* Column 1: LMS Batch Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {batches.map((batch) => {
            const isLive = liveStatuses[batch.id] || false;
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;

            return (
              <div key={batch.id} style={{ background: 'white', padding: '30px', borderRadius: '25px', borderLeft: `10px solid ${batch.color}`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                   <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{batch.name}</h2>
                   {isLive && isEnrolled && <span style={{ color: '#ff4757', fontWeight: 'bold' }}>● LIVE</span>}
                </div>

                {!isEnrolled ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9ff', borderRadius: '15px' }}>
                    <p style={{ color: '#666', marginBottom: '15px' }}>Access recordings, notes, and live classes.</p>
                    <button style={{ padding: '12px 30px', background: batch.color, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Enroll Now</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Live Section */}
                    <div style={{ background: '#f8f9ff', padding: '15px', borderRadius: '12px' }}>
                      <button 
                        onClick={() => isOwner ? toggleClassStatus(batch.id, isLive) : handleJoinClass(batch.roomName)}
                        disabled={!isOwner && !isLive}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: isLive ? '#ff4757' : (isOwner ? batch.color : '#ccc'), color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isOwner ? (isLive ? "End Session" : "Start Session") : (isLive ? "Join Live Class" : "No Live Class")}
                      </button>
                    </div>

                    {/* Materials Section */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>RECORDINGS & NOTES</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {materials.filter(m => m.batch_id === batch.id).length === 0 && <small style={{color:'#999'}}>No materials uploaded yet.</small>}
                        {materials.filter(m => m.batch_id === batch.id).map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '10px' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{m.title}</div>
                              <small style={{ color: batch.color }}>{m.subject}</small>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {m.video_url && <a href={m.video_url} target="_blank" style={iconBtnStyle}>🎥</a>}
                              {m.notes_url && <a href={m.notes_url} target="_blank" style={iconBtnStyle}>📄</a>}
                              
                              {/* --- FACULTY DELETE ICON --- */}
                              {isOwner && (
                                <button 
                                  onClick={() => handleDeleteMaterial(m.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ff4757', padding: '0 5px' }}
                                  title="Delete Material"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isOwner && (
                      <button onClick={() => setShowUploadModal(batch.id)} style={{ border: '1px dashed #6c63ff', color: '#6c63ff', background: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Add Material
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <NoticeBoard category="neet" isOwner={isOwner} />
        <Leaderboard category="neet" />
      </div>
    </div>
  )
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };
const iconBtnStyle = { textDecoration: 'none', fontSize: '18px', padding: '5px' };