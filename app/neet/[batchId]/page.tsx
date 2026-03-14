"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"

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
    try {
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);

      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  // Fixed handlePostNotice: Accepts optional text for automation
  const handlePostNotice = async (textOverride?: string) => {
    const textToSend = textOverride || newNotice;
    if (!textToSend.trim()) return;
    
    setUploading(true);
    try {
      const { data, error } = await supabase.from('notices').insert([{ 
          batch_id: batchId, 
          content: textToSend 
      }]).select();

      if (error) throw error;
      if (data) {
        setNotices(prev => [data[0], ...prev]);
        setNewNotice("");
      }
    } catch (err: any) {
      alert("Database Sync Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return alert("Please fill both Title and Date");
    setUploading(true);
    try {
      const { data, error } = await supabase.from('events').insert([{ 
        batch_id: batchId, 
        title: eventTitle, 
        event_time: eventDate 
      }]).select();

      if (error) throw error;
      
      // Fixed: Now calling the updated function with an argument
      await handlePostNotice(`🗓️ New Event: ${eventTitle} scheduled for ${new Date(eventDate).toLocaleString()}`);
      
      setShowEventModal(false);
      setEventTitle("");
      setEventDate("");
      fetchData(); 
    } catch (err: any) {
      alert("Event Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) fetchData();
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SEPARATED HEADER */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <motion.div whileTap={{ scale: 0.9 }} style={statPill} onClick={() => setShowNotifs(true)}>
              🔔 {notices.length}
            </motion.div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
                style={navAvatar} 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              />
              <span style={navName} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                {userProfile?.student_name || session?.user?.name?.split(' ')[0]}
              </span>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={dropdownMenu}>
                    <button onClick={() => signOut()} style={dropLogout}>Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main style={contentArea}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <small style={{ opacity: 0.7 }}>ACTIVE BATCH</small>
          <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -5, scale: 1.02 }} style={offeringItem}>
                  <span style={{ fontWeight: '700', color: '#333' }}>{item}</span>
                  <span style={{ color: '#6157ff', fontWeight: 'bold' }}>❯</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* STATS & EVENTS INTEGRATED (PW STYLE) */}
        <div style={dashboardGrid}>
          <div style={{ flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => setShowEventModal(true)} style={addBtn}>+ Create</button>}
            </div>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events scheduled.</div> : (
              events.map(ev => (
                <motion.div layout key={ev.id} style={dataRow}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                    <div style={{ fontSize: '12px', color: '#6157ff', fontWeight: '600' }}>
                        {new Date(ev.event_time).toLocaleString()}
                    </div>
                  </div>
                  {isOwner && <button onClick={() => deleteEvent(ev.id)} style={trashBtn}>🗑️</button>}
                </motion.div>
              ))
            )}
          </div>
          
          <div style={statsSidebar}>
             <h3 style={sectionTitle}>Stats</h3>
             <div style={statRow}>
                <span>Total XP Earned</span>
                <b style={{color:'#6157ff', fontSize:'20px'}}>{userProfile?.xp_points || 0}</b>
             </div>
             <div style={statRow}>
                <span>Current Streak</span>
                <b style={{color:'#ff9800', fontSize:'20px'}}>🔥 0</b>
             </div>
          </div>
        </div>
      </main>

      {/* NOTIFICATIONS DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type:'spring', damping:25 }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                <h3 style={{margin:0}}>Notifications</h3>
                <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
              </div>
              {isOwner && (
                <div style={adminPanel}>
                  <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Send an update..." style={notifInput} />
                  <button onClick={() => handlePostNotice()} disabled={uploading} style={sendBtn}>
                    {uploading ? "Posting..." : "Post Announcement"}
                  </button>
                </div>
              )}
              <div style={{padding:'10px', overflowY:'auto', flex: 1}}>
                {notices.map(n => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={n.id} style={notifCard}>
                    <div style={{lineHeight: '1.5'}}>{n.content}</div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px'}}>
                      <small style={{color:'#bbb'}}>{new Date(n.created_at).toLocaleDateString()}</small>
                      {isOwner && <button onClick={() => deleteNotice(n.id)} style={delTextBtn}>Delete</button>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>Schedule Event</h3>
               <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
               <button onClick={handleCreateEvent} style={sendBtn}>Create Event</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- UPDATED STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '65px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPill: any = { background:'#f9fafc', padding:'8px 15px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', border:'1px solid #eee' };
const navAvatar: any = { width:'36px', height:'36px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer', objectFit: 'cover' };
const navName: any = { fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer' };
const contentArea: any = { paddingTop:'100px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'50px', borderRadius:'25px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#333' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const dashboardGrid: any = { display:'flex', gap:'40px', marginTop: '20px' };
const statsSidebar: any = { flex:1, borderLeft:'1px solid #eee', paddingLeft:'30px' };
const statRow: any = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', fontSize:'14px', fontWeight:'600', color: '#666' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const overlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:2000, display:'flex', justifyContent:'flex-end', alignItems: 'center' };
const drawer: any = { width:'420px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' };
const drawerHeader: any = { padding:'25px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const adminPanel: any = { padding:'20px', background:'#f9fafc', borderBottom:'1px solid #eee' };
const notifInput: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #eee', resize:'none', fontSize:'14px' };
const sendBtn: any = { width:'100%', padding:'15px', background:'#6157ff', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold', marginTop:'10px', cursor:'pointer' };
const notifCard: any = { padding:'20px', borderBottom:'1px solid #f9f9f9', fontSize:'14px' };
const closeBtn: any = { background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#ccc' };
const delTextBtn: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const trashBtn: any = { background:'none', border:'none', cursor:'pointer', fontSize: '18px' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee', marginTop:'15px' };
const dropdownMenu: any = { position: 'absolute', top: '45px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0', width: '150px', overflow: 'hidden' };
const dropLogout: any = { padding: '12px 25px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%', textAlign: 'left' };