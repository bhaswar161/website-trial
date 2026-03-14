"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = {
  params: Promise<{ batchId: string }>;
};

export default function BatchDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;

  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [subject, setSubject] = useState("Physics")
  const [title, setTitle] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0) // Progress Bar state
  const [materials, setMaterials] = useState<any[]>([])

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (batchId) fetchMaterials();
  }, [batchId, supabase]);

  const fetchMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    if (data) setMaterials(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || !title) return alert("Please provide a title and video");

    setUploading(true);
    setProgress(10); // Start progress

    try {
      // 1. Upload Video
      const vFileName = `${Date.now()}_${selectedVideo.name.replace(/\s+/g, '_')}`;
      const vPath = `neet/${batchId}/${subject}/${vFileName}`;
      
      const { error: vError } = await supabase.storage.from('batch-materials').upload(vPath, selectedVideo);
      if (vError) throw vError;
      setProgress(50); // Mid-way

      const { data: { publicUrl: videoUrl } } = supabase.storage.from('batch-materials').getPublicUrl(vPath);

      // 2. Upload Notes
      let notesUrl = "";
      if (selectedNotes) {
        const nPath = `neet/${batchId}/${subject}/notes_${Date.now()}_${selectedNotes.name.replace(/\s+/g, '_')}`;
        await supabase.storage.from('batch-materials').upload(nPath, selectedNotes);
        notesUrl = supabase.storage.from('batch-materials').getPublicUrl(nPath).data.publicUrl;
      }
      setProgress(80);

      // 3. Save to DB
      const { error: dbError } = await supabase.from('materials').insert([{
        batch_id: batchId, subject, title, video_url: videoUrl, notes_url: notesUrl, category: 'neet'
      }]);

      if (dbError) throw dbError;

      setProgress(100);
      alert("Success! Material Published.");
      setTitle(""); setSelectedVideo(null); setSelectedNotes(null); setProgress(0);
      fetchMaterials();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, videoUrl: string, notesUrl: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;

    try {
      // Extract file paths from URLs to delete from storage
      const videoPath = videoUrl.split('/public/batch-materials/')[1];
      await supabase.storage.from('batch-materials').remove([videoPath]);
      
      if (notesUrl) {
        const notesPath = notesUrl.split('/public/batch-materials/')[1];
        await supabase.storage.from('batch-materials').remove([notesPath]);
      }

      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;

      fetchMaterials();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  if (status === "loading" || !mounted) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading...</p>
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ padding: '30px 5%', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', background: '#fcfcfc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ textTransform: 'capitalize', color: '#333', margin: 0 }}>{batchId.replace(/-/g, ' ')}</h1>
           <Link href="/neet" style={{ color: '#6c63ff', textDecoration: 'none', fontSize: '14px' }}>← Back to Batches</Link>
        </div>
      </header>

      {isOwner && (
        <section style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #eee' }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Publish New Lecture</h3>
          <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <input type="text" placeholder="Lecture Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
            </div>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
              <option>Physics</option><option>Chemistry</option><option>Biology</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
               <div style={{ flex: 1 }}>
                 <label style={labelStyle}>Video</label>
                 <input type="file" accept="video/*" onChange={e => setSelectedVideo(e.target.files?.[0] || null)} required />
               </div>
               <div style={{ flex: 1 }}>
                 <label style={labelStyle}>Notes (PDF)</label>
                 <input type="file" accept=".pdf" onChange={e => setSelectedNotes(e.target.files?.[0] || null)} />
               </div>
            </div>

            {uploading && (
              <div style={{ gridColumn: '1 / -1', height: '8px', background: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#6c63ff', transition: '0.3s' }} />
              </div>
            )}

            <button type="submit" disabled={uploading} style={uploading ? disabledBtnStyle : btnStyle}>
              {uploading ? `Uploading ${progress}%...` : "Publish Content"}
            </button>
          </form>
        </section>
      )}

      <div style={{ display: 'grid', gap: '30px' }}>
        {materials.map((m) => (
          <div key={m.id} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            {/* INLINE VIDEO PLAYER */}
            <video controls style={{ width: '100%', maxHeight: '400px', background: '#000' }}>
              <source src={m.video_url} type="video/mp4" />
            </video>
            
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 'bold' }}>{m.subject}</span>
                <h4 style={{ margin: '5px 0' }}>{m.title}</h4>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {m.notes_url && <a href={m.notes_url} target="_blank" rel="noreferrer" style={notesBtn}>Notes PDF</a>}
                {isOwner && (
                  <button onClick={() => handleDelete(m.id, m.video_url, m.notes_url)} style={{ background: '#ffebee', color: '#d32f2f', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: any = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' };
const labelStyle: any = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' };
const btnStyle: any = { gridColumn: '1 / -1', padding: '16px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const disabledBtnStyle: any = { ...btnStyle, background: '#aaa', cursor: 'not-allowed' };
const notesBtn: any = { padding: '10px 20px', background: '#f0f0f0', color: '#333', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' };