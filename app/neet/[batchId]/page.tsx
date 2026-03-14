"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<{avatar_url?: string, xp_points?: number} | null>(null)
  
  // Admin Form States
  const [newNotice, setNewNotice] = useState("")
  const [noticeFile, setNoticeFile] = useState<File | null>(null)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [uploading, setUploading] = useState(false)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    // 1. Fetch Custom Profile Pic (Priority over Google)
    const { data: sData } = await supabase.from('student_stats').select('avatar_url, xp_points').eq('email', session?.user?.email).single();
    if (sData) setUserProfile(sData);

    // 2. Fetch Notifications
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    if (nData) setNotices(nData);

    // 3. Fetch Events
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).gte('event_time', new Date().toISOString()).order('event_time', { ascending: true });
    if (eData) setEvents(eData);
  };

  const handlePostNotice = async () => {
    if (!newNotice && !noticeFile) return;
    setUploading(true);
    let imageUrl = "";

    if (noticeFile) {
      const path = `notices/${Date.now()}_${noticeFile.name}`;
      await supabase.storage.from('batch-materials').upload(path, noticeFile);
      imageUrl = supabase.storage.from('batch-materials').getPublicUrl(path).data.publicUrl;
    }

    await supabase.from('notices').insert([{ batch_id: batchId, content: newNotice, image_url: imageUrl }]);
    setNewNotice(""); setNoticeFile(null); setUploading(false);
    fetchData();
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return;
    await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]);
    setShowEventModal(false); setEventTitle("");
    fetchData();
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#fcfcfc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* IMPROVED HEADER UI (PIC 1) */}
      <nav style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/neet" style={backBtnStyle}>←</Link>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Study Hub</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={statCapsule}>🔥 0</div>
          <div style={statCapsule} onClick={() => fetchData()}>XP {userProfile?.xp_points || 0}</div>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifs(true)}>
            🔔 {notices.length > 0 && <span style={notifBadge}>{notices.length}</span>}
          </div>
          <div style={{ position: 'relative' }}>
            <img 
              src={userProfile?.avatar_url || session?.user?.image || "https://ui-avatars.com/api/?name=User"} 
              style={avatarStyle} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />
            {showProfileMenu && (
              <div style={dropdownStyle}>
                <Link href="/profile" style={dropdownItem}>My Profile</Link>
                <button onClick={() => signOut()} style={{...dropdownItem, color: 'red', border: 'none', background: 'none', width: '100%', textAlign: 'left'}}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* BANNER */}
      <div style={bannerStyle}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>YOUR BATCH</span>
        <h1 style={{ margin: '5px 0', fontSize: '32px', letterSpacing: '-1px' }}>{batchId.replace(/-/g, ' ').toUpperCase()}</h1>
      </div>

      <main style={{ padding: '0 5%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* OFFERINGS */}
        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={gridStyle}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map(item => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={offerCard}>
                <span style={{ fontWeight: '700' }}>{item}</span>
                <span style={{ color: '#ccc' }}>❯</span>
              </Link>
            ))}
          </div>
        </section>

        {/* UPCOMING EVENTS (PIC 1) */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={sectionTitle}>Upcoming Events ({events.length})</h3>
            {isOwner && <button onClick={() => setShowEventModal(true)} style={addEventBtn}>+ Create Event</button>}
          </div>

          {events.length === 0 ? (
            <div style={emptyEventCard}>
               <div style={{ fontSize: '40px' }}>🕒</div>
               <p style={{ fontWeight: 'bold', margin: '10px 0 0' }}>No upcoming events,</p>
               <p style={{ color: '#888', fontSize: '14px' }}>Perfect time to catch up on pending work!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {events.map(ev => (
                <div key={ev.id} style={eventRow}>
                   <div style={{fontWeight:'bold'}}>{ev.title}</div>
                   <div style={{color:'#6157ff', fontSize:'13px'}}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* NOTIFICATIONS DRAWER (PIC 2) */}
      {showNotifs && (
        <div style={overlay} onClick={() => setShowNotifs(false)}>
          <div style={drawer} onClick={e => e.stopPropagation()}>
            <div style={drawerHead}>
              <h3 style={{margin:0}}>Notifications</h3>
              <button onClick={() => setShowNotifs(false)} style={{background:'none', border:'none', fontSize:'20px'}}>✕</button>
            </div>
            
            {isOwner && (
              <div style={{ padding: '20px', background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="What's happening?" style={textAreaStyle} />
                <input type="file" accept="image/*" onChange={e => setNoticeFile(e.target.files?.[0] || null)} style={{marginTop:'10px', fontSize:'12px'}} />
                <button onClick={handlePostNotice} disabled={uploading} style={sendBtn}>
                  {uploading ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            )}

            <div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}>
              {notices.map((n, i) => (
                <div key={i} style={notifCard}>
                  {n.image_url && <img src={n.image_url} style={{width:'100%', borderRadius:'10px', marginBottom:'10px'}} alt="notice" />}
                  <div style={{fontWeight:'bold', fontSize:'14px'}}>{n.content}</div>
                  <div style={{fontSize:'10px', color:'#aaa', marginTop:'5px'}}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Create Upcoming Event</h3>
            <input type="text" placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
            <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleCreateEvent} style={sendBtn}>Create</button>
              <button onClick={() => setShowEventModal(false)} style={{...sendBtn, background:'#eee', color:'#333'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- STYLES ---
const headerStyle: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 1000 };
const backBtnStyle: any = { textDecoration: 'none', color: '#000', fontSize: '24px', fontWeight: 'bold', background: '#f0f0f0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statCapsule: any = { background: '#f8f9fa', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', border: '1px solid #eee', cursor: 'pointer' };
const avatarStyle: any = { width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #6157ff', cursor: 'pointer', objectFit: 'cover' };
const bannerStyle: any = { background: '#1c252e', color: '#fff', margin: '25px 5%', padding: '50px', borderRadius: '24px' };
const sectionTitle: any = { fontSize: '20px', fontWeight: '800', color: '#333' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' };
const offerCard: any = { background: '#fff', padding: '25px', borderRadius: '18px', border: '1px solid #eee', textDecoration: 'none', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const emptyEventCard: any = { background: '#fff', border: '1px dashed #ccc', borderRadius: '24px', padding: '50px', textAlign: 'center' };
const eventRow: any = { background: '#fff', padding: '15px 20px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const overlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };
const drawer: any = { width: '400px', height: '100%', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' };
const drawerHead: any = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const textAreaStyle: any = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px', resize: 'none' };
const sendBtn: any = { width: '100%', padding: '12px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };
const notifCard: any = { padding: '15px', borderBottom: '1px solid #f5f5f5' };
const notifBadge: any = { position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };
const dropdownStyle: any = { position: 'absolute', top: '50px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '150px', overflow: 'hidden' };
const dropdownItem: any = { display: 'block', padding: '12px 15px', textDecoration: 'none', color: '#333', fontSize: '14px' };
const modal: any = { background: '#fff', padding: '30px', borderRadius: '24px', width: '400px', margin: '0 auto' };
const modalInput: any = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '10px' };
const addEventBtn: any = { background: '#6157ff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };