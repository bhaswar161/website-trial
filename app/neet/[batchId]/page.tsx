"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingNotif, setEditingNotif] = useState<any>(null)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  const [newNotice, setNewNotice] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [uploading, setUploading] = useState(false)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    // Load unread tracking from browser
    const saved = localStorage.getItem(`last_read_${batchId}`);
    if (saved) setLastReadTime(parseInt(saved));

    setMounted(true);
    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    try {
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);

      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (e) { console.error("Fetch error:", e); }
  };

  // --- UNREAD LOGIC ---
  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  const handleMarkAllRead = () => {
    const now = Date.now();
    setLastReadTime(now);
    localStorage.setItem(`last_read_${batchId}`, now.toString());
  };

  const handleOpenNotifs = () => {
    setShowNotifs(true);
    // Optional: Auto-mark read when opening
    // handleMarkAllRead(); 
  };

  // --- LOGIC ---
  const handlePostNotice = async (textOverride?: any) => {
    const content = typeof textOverride === 'string' ? textOverride : newNotice;
    if (!content || !content.trim()) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.from('notices').insert([{ 
          batch_id: batchId, 
          title: typeof textOverride === 'string' ? "Event Alert" : "Announcement",
          content: content.trim(),
          category: typeof textOverride === 'string' ? "Event" : "General"
      }]).select();
      if (error) throw error;
      if (data) setNotices(prev => [data[0], ...prev]);
      setNewNotice("");
    } catch (err: any) { alert("Error: " + err.message); } finally { setUploading(false); }
  };

  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return alert("Fill fields");
    setUploading(true);
    try {
      const { data, error } = await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]).select();
      if (error) throw error;
      if (data) {
        setEvents(prev => [...prev, data[0]].sort((a,b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()));
        const timeStr = new Date(eventDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        await handlePostNotice(`🗓️ New Event: ${eventTitle} at ${timeStr}`);
      }
      setShowEventModal(false); setEventTitle(""); setEventDate("");
    } catch (err: any) { alert("Error: " + err.message); } finally { setUploading(false); }
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study Hub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={bellContainer} onClick={handleOpenNotifs}>
              <span style={{fontSize: '22px'}}>🔔</span>
              {unreadCount > 0 && <div style={bellBadge}>{unreadCount}</div>}
            </div>
            <img src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} style={navAvatar} onClick={() => setShowProfileMenu(!showProfileMenu)} />
          </div>
        </div>
      </header>

      <main style={contentArea}>
        <div style={batchBanner}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <div style={offeringItem}>
                  <span style={{ fontWeight: '700', color: '#333' }}>{item}</span>
                  <span style={{ color: '#6157ff', fontWeight: 'bold' }}>❯</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Event List Section */}
        <div style={dashboardGrid}>
          <div style={{ flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => setShowEventModal(true)} style={addBtn}>+ Create</button>}
            </div>
            {events.map(ev => (
              <div key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#6157ff', fontWeight: '600' }}>
                      {new Date(ev.event_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                {isOwner && <button onClick={() => { if(confirm("Delete?")) supabase.from('events').delete().eq('id', ev.id).then(() => fetchData()); }} style={deleteActionBtn}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                 <div style={batchTag}>{batchId.toUpperCase()} MISSION...</div>
                 <button onClick={handleMarkAllRead} style={markReadBtn}>Mark All Read</button>
              </div>

              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                <div style={dateLabel}>Today</div>
                {notices.map(n => {
                   const isNew = new Date(n.created_at).getTime() > lastReadTime;
                   return (
                    <div key={n.id} style={notifCardUI}>
                      <div style={iconCircleUI}>
                         <span style={{fontSize: '18px'}}>{n.content.includes('Class') ? '🎥' : '📢'}</span>
                         {isNew && <div style={redDotNotif} />}
                      </div>
                      <div style={{flex: 1}}>
                         <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <div style={notifTitleUI}>{n.title || "Update"}</div>
                            <div style={notifTimeUI}>{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                         <div style={notifBodyUI}>{n.content}</div>
                      </div>
                    </div>
                   )
                })}
              </div>

              {isOwner && (
                <div style={adminNotifPanel}>
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Type new update..." style={notifInputUI} />
                   <button onClick={() => handlePostNotice()} style={notifSendBtn}>Post Notice</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>Schedule Event</h3>
               <input placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{...modalInput, marginTop:'10px'}} />
               <button onClick={handleSaveEvent} style={notifSendBtn}>Create Event</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '70px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff4d4d', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };
const navAvatar: any = { width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer' };
const contentArea: any = { paddingTop:'110px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'50px', borderRadius:'25px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#333' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const dashboardGrid: any = { display:'flex', gap:'40px', marginTop: '20px' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };

const overlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.3)', zIndex:2000, display:'flex', justifyContent:'flex-end' };
const drawer: any = { width:'450px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' };
const drawerHeader: any = { padding:'25px', display:'flex', justifyContent:'space-between', alignItems: 'center', borderBottom: '1px solid #f8f9fa' };
const batchTag: any = { background: '#f0f3ff', color: '#6157ff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const markReadBtn: any = { background: '#fff', border: '1px solid #eee', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#666', cursor: 'pointer' };
const dateLabel: any = { fontSize: '13px', color: '#aaa', margin: '20px 0 15px', fontWeight: '600' };

const notifCardUI: any = { display: 'flex', gap: '15px', padding: '15px', borderRadius: '16px', background: '#fcfdfe', border: '1px solid #f1f4f9', marginBottom: '12px' };
const iconCircleUI: any = { position: 'relative', width: '48px', height: '48px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const redDotNotif: any = { position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', background: '#ff4d4d', borderRadius: '50%', border: '2px solid #fff' };
const notifTitleUI: any = { fontWeight: '700', fontSize: '15px', color: '#111' };
const notifTimeUI: any = { fontSize: '12px', color: '#bbb' };
const notifBodyUI: any = { fontSize: '14px', color: '#666', marginTop: '4px', lineHeight: '1.4' };

const adminNotifPanel: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const notifInputUI: any = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', minHeight: '60px' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };

const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const deleteActionBtn: any = { background: '#fff1f1', color: '#ff4d4d', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };