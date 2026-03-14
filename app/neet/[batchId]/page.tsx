"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function BatchDetailsPage({ params }: { params: { batchId: string } }) {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [subject, setSubject] = useState("Physics")
  const [title, setTitle] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])

  // 1. Initialize Supabase with Session Headers for RLS
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${session?.user ? 'authenticated' : ''}`,
        },
      },
    });
  }, [session]);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (supabase) fetchMaterials();
  }, [params.batchId, supabase])

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('batch_id', params.batchId)
      .order('created_at', { ascending: false });
    if (data) setMaterials(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || !title) return alert("Please provide a title and video");

    setUploading(true);
    try {
      // 1. Upload Video to Storage
      const vFileName = `${Date.now()}_${selectedVideo.name.replace(/\s+/g, '_')}`;
      const vPath = `neet/${params.batchId}/${subject}/${vFileName}`;
      
      const { error: vError } = await supabase.storage
        .from('batch-materials')
        .upload(vPath, selectedVideo);
      
      if (vError) throw vError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('batch-materials')
        .getPublicUrl(vPath);

      // 2. Upload Notes (Optional)
      let notesUrl = "";
      if (selectedNotes) {
        const nFileName = `notes_${Date.now()}_${selectedNotes.name.replace(/\s+/g, '_')}`;
        const nPath = `neet/${params.batchId}/${subject}/${nFileName}`;
        await supabase.storage.from('batch-materials').upload(nPath, selectedNotes);
        notesUrl = supabase.storage.from('batch-materials').getPublicUrl(nPath).data.publicUrl;
      }

      // 3. Save to Database
      const { error: dbError } = await supabase.from('materials').insert([{
        batch_id: params.batchId,
        subject,
        title,
        video_url: videoUrl,
        notes_url: notesUrl,
        category: 'neet'
      }]);

      if (dbError) throw dbError;

      alert("Success! Content is now live.");
      setTitle("");
      setSelectedVideo(null);
      setSelectedNotes(null);
      fetchMaterials();
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || !mounted) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading Batch Content...</p>
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ padding: '30px 5%', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ textTransform: 'capitalize', color: '#333' }}>
          {params.batchId.replace(/-/g, ' ')}
        </h1>
        <Link href="/neet" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Back to NEET Portal
        </Link>
      </header>

      {isOwner && (
        <section style={{ background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '40px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Faculty: Upload New Material</h3>
          <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Lecture Title</label>
              <input type="text" placeholder="e.g. Newton's Laws of Motion" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
            </div>
            
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Lecture Video</label>
              <input type="file" accept="video/*" onChange={e => setSelectedVideo(e.target.files?.[0] || null)} required />
            </div>

            <div>
              <label style={labelStyle}>Lecture Notes (PDF)</label>
              <input type="file" accept=".pdf" onChange={e => setSelectedNotes(e.target.files?.[0] || null)} />
            </div>

            <button type="submit" disabled={uploading} style={uploading ? disabledBtnStyle : btnStyle}>
              {uploading ? "Uploading to Server..." : "Publish Content"}
            </button>
          </form>
        </section>
      )}

      <section>
        <h3 style={{ color: '#444' }}>Batch Lectures</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          {materials.map((m) => (
            <div key={m.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{m.subject}</span>
                <h4 style={{ margin: '5px 0', color: '#333' }}>{m.title}</h4>
                <small style={{ color: '#999' }}>Uploaded on: {new Date(m.created_at).toLocaleDateString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={m.video_url} target="_blank" rel="noreferrer" style={actionBtn}>Watch Video</a>
                {m.notes_url && <a href={m.notes_url} target="_blank" rel="noreferrer" style={notesBtn}>Download PDF</a>}
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px', color: '#888' }}>
              No lectures have been uploaded for this batch yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// Inline Styles
const inputStyle: any = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' };
const labelStyle: any = { display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' };
const btnStyle: any = { gridColumn: '1 / -1', padding: '16px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: '0.2s' };
const disabledBtnStyle: any = { ...btnStyle, background: '#aaa', cursor: 'not-allowed' };
const actionBtn: any = { padding: '10px 20px', background: '#6c63ff', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' };
const notesBtn: any = { ...actionBtn, background: '#f0f0f0', color: '#333', border: '1px solid #ddd' };