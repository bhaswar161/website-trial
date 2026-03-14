"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = {
  params: Promise<{ batchId: string }>;
};

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // Form States
  const [subject, setSubject] = useState("Physics")
  const [title, setTitle] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { setMounted(true) }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // Feature: Allow either video OR notes
    if (!title) return alert("Please enter a title");
    if (!selectedVideo && !selectedNotes) return alert("Please select at least a Video or a PDF Note");

    setUploading(true);
    setProgress(5);

    try {
      let videoUrl = "";
      let notesUrl = "";

      // 1. Upload Video if selected
      if (selectedVideo) {
        const vPath = `neet/${batchId}/${subject}/vid_${Date.now()}_${selectedVideo.name.replace(/\s+/g, '_')}`;
        const { error: vError } = await supabase.storage.from('batch-materials').upload(vPath, selectedVideo);
        if (vError) throw vError;
        videoUrl = supabase.storage.from('batch-materials').getPublicUrl(vPath).data.publicUrl;
        setProgress(50);
      }

      // 2. Upload Notes if selected
      if (selectedNotes) {
        const nPath = `neet/${batchId}/${subject}/notes_${Date.now()}_${selectedNotes.name.replace(/\s+/g, '_')}`;
        const { error: nError } = await supabase.storage.from('batch-materials').upload(nPath, selectedNotes);
        if (nError) throw nError;
        notesUrl = supabase.storage.from('batch-materials').getPublicUrl(nPath).data.publicUrl;
        setProgress(80);
      }

      // 3. Save Record
      const { error: dbError } = await supabase.from('materials').insert([{
        batch_id: batchId,
        subject,
        title,
        video_url: videoUrl, // Can be empty if only notes posted
        notes_url: notesUrl, // Can be empty if only video posted
        category: 'neet'
      }]);

      if (dbError) throw dbError;

      setProgress(100);
      alert("Success! Material Published.");
      setTitle(""); setSelectedVideo(null); setSelectedNotes(null); setProgress(0);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || !mounted) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading...</p>
  if (status === "unauthenticated") redirect("/api/auth/signin")

  const offerings = [
    { title: "All Classes", icon: "📘", color: "#6c63ff", link: `/neet/${batchId}/all-classes` },
    { title: "All Tests", icon: "📝", color: "#4caf50", link: "#" },
    { title: "My Doubts", icon: "❓", color: "#ff9800", link: "#" },
    { title: "Community", icon: "👥", color: "#2196f3", link: "#" },
    { title: "Preparation Meter", icon: "⏲️", color: "#f44336", link: "#" },
    { title: "Infinite Practice", icon: "♾️", color: "#9c27b0", link: "#" },
  ];

  return (
    <div style={{ background: '#f5f7fb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #2c3e50, #000)', color: '#fff', padding: '60px 8%' }}>
        <h1 style={{ margin: 0, fontSize: '36px' }}>{batchId.toUpperCase()} DASHBOARD</h1>
      </header>

      <main style={{ padding: '40px 8%', maxWidth: '1200px', margin: '0 auto' }}>
        
        <section style={{ marginBottom: '50px' }}>
          <h3 style={{ marginBottom: '25px' }}>Batch Offerings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {offerings.map((item) => (
              <Link key={item.title} href={item.link} style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '24px', background: `${item.color}15`, padding: '12px', borderRadius: '12px' }}>{item.icon}</div>
                    <span style={{ fontWeight: '600', color: '#444' }}>{item.title}</span>
                  </div>
                  <span>❯</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {isOwner && (
          <section style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #eee' }}>
            <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Faculty Mode: Post Content</h3>
            <form onSubmit={handleUpload} style={{ display: 'grid', gap: '20px' }}>
              <input type="text" placeholder="Lecture Title (e.g. Physics Chapter 1)" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              
              <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
                <option>Physics</option><option>Chemistry</option><option>Biology</option>
              </select>

              {/* DRAG & DROP ZONE FOR VIDEO */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setSelectedVideo(e.dataTransfer.files[0]); }}
                style={dropZoneStyle}
              >
                {selectedVideo ? `✅ Video: ${selectedVideo.name}` : "🎥 Drag & Drop Video here or click to select"}
                <input type="file" accept="video/*" onChange={e => setSelectedVideo(e.target.files?.[0] || null)} style={fileInputHidden} />
              </div>

              {/* DRAG & DROP ZONE FOR NOTES */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setSelectedNotes(e.dataTransfer.files[0]); }}
                style={{...dropZoneStyle, borderStyle: 'dotted'}}
              >
                {selectedNotes ? `✅ PDF: ${selectedNotes.name}` : "📄 Drag & Drop PDF Notes here or click to select"}
                <input type="file" accept=".pdf" onChange={e => setSelectedNotes(e.target.files?.[0] || null)} style={fileInputHidden} />
              </div>

              {uploading && (
                <div style={{ height: '8px', background: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#6c63ff', transition: '0.3s' }} />
                </div>
              )}

              <button type="submit" disabled={uploading} style={btnStyle}>
                {uploading ? `Uploading ${progress}%...` : "Publish to All Classes"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

// Styles
const cardStyle: any = { background: '#fff', padding: '20px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eee', color: '#444' };
const inputStyle: any = { padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px' };
const dropZoneStyle: any = { border: '2px dashed #ccc', borderRadius: '15px', padding: '30px', textAlign: 'center', color: '#888', cursor: 'pointer', position: 'relative' };
const fileInputHidden: any = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' };
const btnStyle: any = { padding: '18px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };