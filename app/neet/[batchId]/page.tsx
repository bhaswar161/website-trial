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
  const [userProfile, setUserProfile] = useState<any>(null)
  
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
    // 1. Fetch Profile (Internal DB priority)
    const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
    if (sData) setUserProfile(sData);

    // 2. Fetch Notifications
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    setNotices(nData || []);

    // 3. Fetch Events
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    setEvents(eData || []);
  };

  const handlePostNotice = async (contentOverride?: string) => {
    const content = contentOverride || newNotice;
    if (!content && !noticeFile) return;
    setUploading(true);
    try {
      let imageUrl = "";
      if (noticeFile) {
        const path = `notices/${Date.now()}_${noticeFile.name}`;
        await supabase.storage.from('batch-materials').upload(path, noticeFile);
        imageUrl = supabase.storage.from('batch-materials').getPublicUrl(path).data.publicUrl;
      }
      await supabase.from('notices').insert([{ batch_id: batchId, content, image_url: imageUrl }]);
      setNewNotice(""); setNoticeFile(null);
      await fetchData();
    } finally { setUploading(false); }
  };

  const deleteNotice = async (id: string) => {
    if (confirm("Delete this notification?")) {
      await supabase.from('notices').delete().eq('id', id);
      fetchData();
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return;
    const { error } = await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]);
    if (!error) {
      await handlePostNotice(`📢 New Event: ${eventTitle} at ${new Date(eventDate).toLocaleString()}`);
      setShowEventModal(false); setEventTitle(""); setEventDate("");
      fetchData();
    }
  };

  const deleteEvent = async (id: string) => {
    if (confirm("Delete this event?")) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  };

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- SEPARATED FIXED HEADER --- */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backCircle}>←</Link>
            <h1 style={{ fontSize: '18px', margin: 0 }}>Dashboard</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statChip} onClick={() => setShowNotifs(true)}>🔔 {notices.length}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
               <img 
                 src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
                 style={navAvatar} 
                 onClick={() => setShowProfileMenu(!showProfileMenu)}
               />
               <span style={{ fontWeight: '600', fontSize: '14px' }}>{userProfile?.student_name || session?.user?.name}</span>
               {showProfileMenu && (
                 <div style={dropdownMenu}>
                   <Link href="/profile" style={dropLink}>My Profile</Link>
                   <button onClick={() => signOut()} style={dropLogout}>Logout</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN PAGE CONTENT (INSET) --- */}
      <main style={contentWrapper}>
        
        {/* Banner Card */}
        <div style={batchBanner}>
          <p style={{ opacity: 0.6, fontSize: '12px', margin: 0 }}>ACTIVE BATCH</p>
          <h2 style={{ fontSize: '32px', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </div>

        <div style={dashboardGrid}>
          {/* Left Column: Offerings & Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <section style={glassCard}>
              <h3 style={cardTitle}>Batch Offerings</h3>
              <div style={offeringGrid}>
                {['All Classes', 'All Tests', 'My Doubts', 'Community'].map(item => (
                  <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={offeringItem}>
                    {item} <span>→</span>
                  </Link>
                ))}
              </div>
            </section>

            <section style={glassCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={cardTitle}>Upcoming Events</h3>
                {isOwner && <button onClick={() => setShowEventModal(true)} style={actionBtn}>+ Create</button>}
              </div>
              {events.length === 0 ? <p style={emptyMsg}>No upcoming events scheduled.</p> : (
                events.map(ev => (
                  <div key={ev.id} style={itemRow}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                      <div style={{ fontSize: '12px', color: '#6157ff' }}>{new Date(ev.event_time).toLocaleString()}</div>
                    </div>
                    {isOwner && <button onClick={() => deleteEvent(ev.id)} style={trashBtn}>🗑️</button>}
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Right Column: Mini Leaderboard or Stats */}
          <section style={glassCard}>
             <h3 style={cardTitle}>Your Progress</h3>
             <div style={statBox}>
                <p>Current XP</p>
                <h1>{userProfile?.xp_points || 0}</h1>
             </div>
          </section>
        </div>
      </main>

      {/* --- NOTIFICATIONS DRAWER --- */}
      {showNotifs && (
        <div style={overlay} onClick={() => setShowNotifs(false)}>
          <div style={drawer} onClick={e => e.stopPropagation()}>
            <div style={drawerHeader}>
              <h3>Notifications</h3>
              <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
            </div>
            {isOwner && (
              <div style={adminNotifBox}>
                <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Send an update..." style={notifInput} />
                <input type="file" onChange={e => setNoticeFile(e.target.files?.[0] || null)} style={{fontSize:'12px', marginTop:'10px'}} />
                <button onClick={() => handlePostNotice()} disabled={uploading} style={submitBtn}>
                  {uploading ? 'Uploading...' : 'Send Message'}
                </button>
              </div>
            )}
            <div style={notifList}>
              {notices.map(n => (
                <div key={n.id} style={notifCard}>
                  {n.image_url && <img src={n.image_url} style={notifImg} alt="update" />}
                  <p style={{ margin: 0, fontSize: '14px' }}>{n.content}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop: '10px' }}>
                    <small style={{ color: '#aaa' }}>{new Date(n.created_at).toLocaleDateString()}</small>
                    {isOwner && <button onClick={() => deleteNotice(n.id)} style={trashBtn}>🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- EVENT MODAL --- */}
      {showEventModal && (
        <div style={overlay} onClick={() => setShowEventModal(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0}}>New Event</h3>
            <input placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
            <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
            <button onClick={handleCreateEvent} style={submitBtn}>Confirm Event</button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position: 'fixed', top: 0, left: 0, width: '100%', background: '#fff', borderBottom: '1px solid #e0e0e0', zIndex: 1000, height: '70px' };
const headerInner: any = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 20px' };
const backCircle: any = { textDecoration: 'none', color: '#333', background: '#f0f2f5', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const statChip: any = { background: '#f0f2f5', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' };
const navAvatar: any = { width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', border: '2px solid #6157ff' };
const contentWrapper: any = { paddingTop: '90px', paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' };
const batchBanner: any = { background: '#1c252e', color: '#fff', padding: '40px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' };
const dashboardGrid: any = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' };
const glassCard: any = { background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #eef0f2', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const cardTitle: any = { margin: 0, fontSize: '18px', fontWeight: '700', color: '#333' };
const offeringGrid: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' };
const offeringItem: any = { padding: '20px', background: '#f8f9fa', borderRadius: '16px', textDecoration: 'none', color: '#333', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' };
const itemRow: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f5f5f5' };
const trashBtn: any = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' };
const actionBtn: any = { background: '#6157ff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const emptyMsg: any = { color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '20px' };
const statBox: any = { textAlign: 'center', padding: '30px', background: '#6157ff10', borderRadius: '20px', marginTop: '20px' };
const overlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };
const drawer: any = { width: '400px', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' };
const drawerHeader: any = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const closeBtn: any = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const adminNotifBox: any = { padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #eee' };
const notifInput: any = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', resize: 'none' };
const submitBtn: any = { width: '100%', padding: '14px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };
const notifList: any = { flex: 1, overflowY: 'auto', padding: '10px' };
const notifCard: any = { padding: '15px', borderBottom: '1px solid #f9f9f9' };
const notifImg: any = { width: '100%', borderRadius: '12px', marginBottom: '10px' };
const dropdownMenu: any = { position: 'absolute', top: '50px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '150px', overflow: 'hidden' };
const dropLink: any = { display: 'block', padding: '12px 15px', textDecoration: 'none', color: '#333', fontSize: '14px' };
const dropLogout: any = { width: '100%', textAlign: 'left', padding: '12px 15px', color: 'red', border: 'none', background: 'none', cursor: 'pointer' };
const modal: any = { background: '#fff', padding: '30px', borderRadius: '24px', width: '400px', margin: 'auto' };
const modalInput: any = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '10px' };