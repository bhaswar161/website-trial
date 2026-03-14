"use client";
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import NoticeBoard from '../../components/NoticeBoard'
import Leaderboard from '../../components/Leaderboard'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BatchDetailsPage() {
  const { batchId } = useParams()
  const { data: session } = useSession()
  const [materials, setMaterials] = useState<any[]>([])
  const [liveStatus, setLiveStatus] = useState(false)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"
  const batchName = batchId === "ultimate-2026" ? "Yakeen NEET 2026" : "NEET Crash Course 2026"
  const themeColor = batchId === "ultimate-2026" ? "#6c63ff" : "#ff4ecd"

  // Optimized Fetch Logic
  const fetchData = useCallback(async () => {
    if (!batchId) return;

    // Fetch Materials
    const { data: mats } = await supabase
      .from('materials')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });
    
    if (mats) setMaterials(mats);
    
    // Fetch Live Status
    const { data: status } = await supabase
      .from('class_status')
      .select('is_live')
      .eq('id', batchId)
      .single();
      
    if (status) setLiveStatus(status.is_live);
  }, [batchId]);

  useEffect(() => {
    fetchData();

    // REALTIME: Sync files and live status across all users instantly
    const channel = supabase
      .channel(`batch-${batchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `batch_id=eq.${batchId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_status', filter: `id=eq.${batchId}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [batchId, fetchData]);

  const toggleLive = async () => {
    if (!isOwner) return;
    const newStatus = !liveStatus;
    setLiveStatus(newStatus);
    await supabase.from('class_status').update({ is_live: newStatus }).eq('id', batchId);
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!selectedVideo && !selectedNotes) return alert("Please add a file");
    setUploadProgress(20);

    const formData = new FormData(e.target);
    const subject = formData.get('subject');
    const title = formData.get('title');

    try {
      let videoUrl = null, notesUrl = null;

      if (selectedVideo) {
        const vPath = `neet/${batchId}/${subject}/v_${Date.now()}.${selectedVideo.name.split('.').pop()}`;
        await supabase.storage.from('batch-materials').upload(vPath, selectedVideo);
        videoUrl = supabase.storage.from('batch-materials').getPublicUrl(vPath).data.publicUrl;
      }

      if (selectedNotes) {
        const nPath = `neet/${batchId}/${subject}/n_${Date.now()}.${selectedNotes.name.split('.').pop()}`;
        await supabase.storage.from('batch-materials').upload(nPath, selectedNotes);
        notesUrl = supabase.storage.from('batch-materials').getPublicUrl(nPath).data.publicUrl;
      }

      const { error } = await supabase.from('materials').insert([{
        batch_id: batchId,
        subject,
        title,
        video_url: videoUrl,
        notes_url: notesUrl,
        category: 'neet'
      }]);

      if (error) throw error;

      alert("Success! Content is now live.");
      setShowUploadModal(false);
      setSelectedVideo(null); setSelectedNotes(null);
      fetchData(); // Immediate local refresh
    } catch (err) { 
      console.error(err);
      alert("Upload failed. Check your Supabase storage permissions."); 
    } finally { setUploadProgress(0); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', fontFamily: 'sans-serif' }}>
      
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleUpload} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '450px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{margin:0}}>Upload to {batchName}</h3>
            <select name="subject" required style={inputStyle}><option>Physics</option><option>Chemistry</option><option>Biology</option></select>
            <input name="title" placeholder="Topic Title" required style={inputStyle} />
            
            <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); setSelectedVideo(e.dataTransfer.files[0])}} style={dropZoneStyle} onClick={()=>document.getElementById('vIn')?.click()}>
               <input type="file" id="vIn" hidden accept="video/*" onChange={(e)=>setSelectedVideo(e.target.files![0])} />
               🎥 {selectedVideo ? selectedVideo.name : "Drop Video Recording"}
            </div>

            <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); setSelectedNotes(e.dataTransfer.files[0])}} style={{...dropZoneStyle, borderColor:'#ff4ecd'}} onClick={()=>document.getElementById('nIn')?.click()}>
               <input type="file" id="nIn" hidden accept=".pdf" onChange={(e)=>setSelectedNotes(e.target.files![0])} />
               📄 {selectedNotes ? selectedNotes.name : "Drop PDF Notes"}
            </div>

            {uploadProgress > 0 && <div style={{height:'4px', width:'100%', background:'#eee', borderRadius:'2px'}}><div style={{height:'100%', width:`${uploadProgress}%`, background:themeColor, borderRadius:'2px'}} /></div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowUploadModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: themeColor, color: 'white', border: 'none', fontWeight:'bold' }}>Upload Content</button>
            </div>
          </form>
        </div>
      )}

      <header style={{ background: themeColor, padding: '40px 5%', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Link href="/neet" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to All Batches</Link>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem' }}>{batchName}</h1>
      </header>

      <div style={{ padding: '40px 5%', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        <div>
          <h4 style={{ color: '#666', marginBottom: '15px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Batch Offerings</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '35px' }}>
            <div style={tileStyle}>📚 All Classes</div>
            <div style={tileStyle}>📝 All Tests</div>
            <div style={tileStyle}>❓ My Doubts</div>
            <div style={tileStyle}>👥 Community</div>
          </div>

          <h4 style={{ color: '#666', marginBottom: '15px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Study Zone</h4>

          {liveStatus && (
            <div style={{ 
                background: '#fff', 
                padding: '20px', 
                borderRadius: '15px', 
                border: `2px solid ${themeColor}`, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                marginBottom: '25px',
                boxShadow: `0 8px 20px ${themeColor}15` 
            }}>
                <div style={{ height: '50px', width: '50px', background: themeColor, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', textAlign: 'center', lineHeight: '50px' }}>🎥</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: themeColor, fontWeight: 'bold', textTransform: 'uppercase' }}>● Live Now</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>Class is in Progress</div>
                </div>
                <Link href={`/neet/live/${batchId}`} target="_blank">
                    <button style={{ padding: '10px 25px', background: themeColor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Join Now</button>
                </Link>
            </div>
          )}

          {['Physics', 'Chemistry', 'Biology'].map(sub => (
            <details key={sub} open style={folderStyle}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: themeColor, outline: 'none' }}>📂 {sub}</summary>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {materials.filter(m => m.subject === sub).map(m => (
                  <div key={m.id} style={materialItemStyle}>
                    <span style={{ fontWeight: '500' }}>{m.title}</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {m.video_url && <a href={m.video_url} target="_blank" style={{ textDecoration: 'none', fontSize: '18px' }}>🎥</a>}
                        {m.notes_url && <a href={m.notes_url} target="_blank" style={{ textDecoration: 'none', fontSize: '18px' }}>📄</a>}
                    </div>
                  </div>
                ))}
                {materials.filter(m => m.subject === sub).length === 0 && <small style={{ color: '#999', padding: '10px' }}>No materials uploaded yet.</small>}
              </div>
            </details>
          ))}

          {isOwner && (
            <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
               <button onClick={toggleLive} style={{ flex: 1, padding: '18px', borderRadius: '15px', border: 'none', background: liveStatus ? '#ff4757' : themeColor, color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  {liveStatus ? "🔴 End Live Session" : "🟢 Start Live Session"}
               </button>
               <button onClick={() => setShowUploadModal(true)} style={{ flex: 1, padding: '18px', borderRadius: '15px', border: `2px dashed ${themeColor}`, background: 'white', color: themeColor, fontWeight: 'bold', cursor: 'pointer' }}>
                  + Add Subject Content
               </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <NoticeBoard category="neet" isOwner={isOwner} />
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Leaderboard category="neet" />
          </div>
        </div>

      </div>
    </div>
  )
}

const tileStyle = { background: '#fff', padding: '25px', borderRadius: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #f0f0f0', fontSize: '15px' };
const folderStyle = { background: '#fff', padding: '18px', borderRadius: '15px', marginBottom: '12px', border: '1px solid #eee', transition: '0.3s' };
const materialItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#f9f9fb', borderRadius: '10px', fontSize: '14px' };
const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #eee', fontSize: '14px', outline: 'none' };
const dropZoneStyle = { border: '2px dashed #6c63ff', padding: '30px', borderRadius: '20px', textAlign: 'center' as const, fontSize: '14px', color: '#666', background: '#fcfcfc', cursor: 'pointer' };