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
  
  // Drag and Drop States
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

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!supabase || !selectedFile) return alert("Please drop or select a file first");
    
    setUploadProgress(10);
    const formData = new FormData(e.target);
    const subject = formData.get('subject');
    const title = formData.get('title');

    // 1. Upload to Supabase Storage
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `neet/${showUploadModal}/${subject}/${fileName}`;

    const { error: uploadError, data: storageData } = await supabase.storage
      .from('batch-materials')
      .upload(filePath, selectedFile);

    if (uploadError) return alert("Storage Upload Failed");
    setUploadProgress(60);

    const { data: { publicUrl } } = supabase.storage.from('batch-materials').getPublicUrl(filePath);

    // 2. Insert into Materials Table
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

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!supabase) return;
    setLiveStatuses(prev => ({ ...prev, [batchId]: !currentStatus }));
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId);
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading NEET Section...</div>

  const batches = [
    { id: "ultimate-2026", name: "NEET 2026 Ultimate Batch", color: "#6c63ff" },
    { id: "crash-course", name: "NEET Crash Course", color: "#ff4ecd" }
  ]

  return (
    <div style={{ padding: '40px 5%', background: '#f5f7fb', minHeight: '100vh' }}>
      
      {/* Subject-Wise Drag & Drop Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleUpload} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '450px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Add to {batches.find(b => b.id === showUploadModal)?.name}</h3>
            
            <select name="subject" required style={inputStyle}>
              <option>Physics</option><option>Chemistry</option><option>Biology</option>
            </select>
            <input name="title" placeholder="Topic Name (e.g. Thermodynamics)" required style={inputStyle} />
            
            {/* Drag & Drop Area */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
              }}
              style={{ 
                border: `2px dashed ${isDragging ? '#6c63ff' : '#ccc'}`, 
                padding: '30px', borderRadius: '15px', textAlign: 'center',
                background: isDragging ? '#f0f0ff' : '#fafafa', cursor: 'pointer'
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input type="file" id="fileInput" hidden onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
              {selectedFile ? `✅ ${selectedFile.name}` : "Drag & Drop Video or PDF here"}
            </div>

            {uploadProgress > 0 && <div style={{height:'4px', width:`${uploadProgress}%`, background:'#6c63ff', transition:'0.3s'}} />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => {setShowUploadModal(null); setSelectedFile(null);}} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#6c63ff', color: 'white', border: 'none', fontWeight:'bold' }}>Upload Now</button>
            </div>
          </form>
        </div>
      )}

      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#333', fontSize: '2.2rem' }}>NEET Section</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
           <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Back</Link>
           {isOwner && <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>• Faculty Mode</div>}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 320px', gap: '25px', alignItems: 'start' }}>
        
        {/* Main Column: Batches with Subject Separation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {batches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
            return (
              <div key={batch.id} style={{ background: 'white', padding: '30px', borderRadius: '30px', borderLeft: `12px solid ${batch.color}`, boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <h2 style={{ margin: 0 }}>{batch.name}</h2>
                  {isOwner && (
                    <button onClick={() => toggleClassStatus(batch.id, liveStatuses[batch.id])} style={{ padding: '8px 15px', borderRadius: '10px', border: 'none', background: liveStatuses[batch.id] ? '#ff4757' : batch.color, color: 'white', fontWeight: 'bold', cursor:'pointer' }}>
                       {liveStatuses[batch.id] ? "🔴 Live Now" : "Go Live"}
                    </button>
                  )}
                </div>

                {!isEnrolled ? (
                   <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9ff', borderRadius: '20px' }}>
                      <p>Enroll in this batch to access subject-wise content.</p>
                      <button style={{ padding: '12px 40px', background: batch.color, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Enroll Now</button>
                   </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    {['Physics', 'Chemistry', 'Biology'].map(subject => (
                      <div key={subject} style={{ background: '#fcfcfd', padding: '15px', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: batch.color }}>{subject}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {materials.filter(m => m.batch_id === batch.id && m.subject === subject).map(m => (
                            <div key={m.id} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'white', padding:'8px', borderRadius:'8px', border:'1px solid #f0f0f0' }}>
                              <span style={{fontWeight:'500'}}>{m.title}</span>
                              <div style={{display:'flex', gap:'5px'}}>
                                <a href={m.video_url || m.notes_url} target="_blank" style={{textDecoration:'none'}}>{m.video_url ? '🎥' : '📄'}</a>
                                {isOwner && <button onClick={() => handleDeleteMaterial(m.id)} style={{border:'none', background:'none', cursor:'pointer'}}>🗑️</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {isOwner && (
                      <button onClick={() => setShowUploadModal(batch.id)} style={{ gridColumn: 'span 3', marginTop: '10px', padding: '12px', border: '2px dashed #ccc', borderRadius: '15px', background: 'none', color: '#888', fontWeight: 'bold', cursor: 'pointer' }}>
                         + Add Subject Material (Drag & Drop)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Section-Level Components (NEET Level) */}
        <NoticeBoard category="neet" isOwner={isOwner} />
        <Leaderboard category="neet" />
      </div>
    </div>
  )
}

const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' };