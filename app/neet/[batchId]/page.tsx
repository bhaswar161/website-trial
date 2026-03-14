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
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingNotif, setEditingNotif] = useState<any>(null)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [streakData, setStreakData] = useState<any>({ current_streak: 0, mins_watched_today: 0, achieved_today: false })
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
    const saved = localStorage.getItem(`last_read_${batchId}`);
    if (saved) setLastReadTime(parseInt(saved));
    setMounted(true);
    if (session?.user?.email) {
        fetchData();
        syncStreak();
    }
  }, [batchId, session]);

  const fetchData = async () => {
    try {
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);

      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (e) { console.error(e); }
  };

  // --- STREAK LOGIC ---
  const syncStreak = async () => {
    const email = session?.user?.email;
    const today = new Date().toISOString().split('T')[0];

    let { data, error } = await supabase.from('user_streaks').select('*').eq('email', email).single();

    if (!data) {
      const { data: newData } = await supabase.from('user_streaks').insert([{ 
          email, 
          user_id: (session?.user as any)?.id, 
          current_streak: 0, 
          last_activity_date: today 
      }]).select().single();
      data = newData;
    }

    const lastDate = data.last_activity_date;
    const diffInDays = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));

    let currentStreak = data.current_streak;
    let minsToday = data.mins_watched_today;

    if (diffInDays > 1) {
      currentStreak = 0; // Reset streak if missed a day
      minsToday = 0;
    } else if (diffInDays === 1) {
      minsToday = 0; // New day started
    }

    setStreakData({ ...data, current_streak: currentStreak, mins_watched_today: minsToday });
  };

  // Call this function when user watches 1 minute of video
  const handleWatchProgress = async (mins: number) => {
    if (streakData.achieved_today) return;
    
    const newMins = streakData.mins_watched_today + mins;
    let newStreak = streakData.current_streak;
    let achievedToday = streakData.achieved_today;

    if (newMins >= 10 && !achievedToday) {
      newStreak += 1;
      achievedToday = true;
    }

    const { error } = await supabase.from('user_streaks').update({
        mins_watched_today: newMins,
        current_streak: newStreak,
        streak_achieved_today: achievedToday,
        last_activity_date: new Date().toISOString().split('T')[0]
    }).eq('email', session?.user?.email);

    if (!error) setStreakData({ ...streakData, mins_watched_today: newMins, current_streak: newStreak, achieved_today: achievedToday });
  };

  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  const handleMarkAllRead = () => {
    const now = Date.now();
    setLastReadTime(now);
    localStorage.setItem(`last_read_${batchId}`, now.toString());
  };

  // --- ACTIONS ---
  const handlePostNotice = async () => {
    if (!newNotice.trim()) return;
    setUploading(true);
    try {
      if (editingNotif) {
        await supabase.from('notices').update({ content: newNotice.trim() }).eq('id', editingNotif.id);
      } else {
        await supabase.from('notices').insert([{ batch_id: batchId, title: "Announcement", content: newNotice.trim() }]);
      }
      setNewNotice(""); setEditingNotif(null); fetchData();
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete notice?")) return;
    await supabase.from('notices').delete().eq('id', id);
    fetchData();
  };

  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return;
    setUploading(true);
    try {
      if (editingEvent) {
        await supabase.from('events').update({ title: eventTitle, event_time: eventDate }).eq('id', editingEvent.id);
      } else {
        await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]);
      }
      setShowEventModal(false); setEditingEvent(null); setEventTitle(""); setEventDate(""); fetchData();
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={statPillGroup}>
                <motion.div whileTap={{ scale: 0.95 }} style={streakPill} onClick={() => setShowStreakModal(true)}>
                    🔥 {streakData.current_streak}
                </motion.div>
                <div style={bellContainer} onClick={() => setShowNotifs(true)}>
                    🔔 {unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </div>
            </div>
            <img src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} style={navAvatar} onClick={() => setShowProfileMenu(!showProfileMenu)} />
          </div>
        </div>
      </header>

      <main style={contentArea}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <small style={{ opacity: 0.7 }}>ACTIVE BATCH</small>
          <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
          <div style={{marginTop: '10px', fontSize: '14px'}}>
             Today's Progress: <b>{streakData.mins_watched_today} / 10 mins</b> watched
             <button onClick={() => handleWatchProgress(5)} style={simBtn}>+5m Simulate</button>
          </div>
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

        <div style={dashboardGrid}>
          <div style={{ flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => {setEditingEvent(null); setShowEventModal(true)}} style={addBtn}>+ Create</button>}
            </div>
            {events.map(ev => (
              <div key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#6157ff' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && (
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={() => {setEditingEvent(ev); setEventTitle(ev.title); setEventDate(ev.event_time.slice(0,16)); setShowEventModal(true)}} style={editActionBtn}>Edit</button>
                        <button onClick={() => { if(confirm("Delete?")) supabase.from('events').delete().eq('id', ev.id).then(() => fetchData()) }} style={deleteActionBtn}>Delete</button>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* STREAK MODAL (Matching Pic 3) */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={streakCard} onClick={e => e.stopPropagation()}>
              <button style={closeX} onClick={() => setShowStreakModal(false)}>✕</button>
              
              <div style={streakHeaderBg}>
                 <div style={streakCircle}>
                    <span style={streakNumber}>{streakData.current_streak}</span>
                    <span style={fireSmall}>🔥</span>
                 </div>
              </div>

              <div style={streakContent}>
                 <h2 style={{margin:'10px 0', fontSize: '24px', fontWeight: '800'}}>Days Streak!!</h2>
                 <p style={streakSub}>Your streak starts now!</p>
                 <p style={streakSub}>Let's make learning a daily habit</p>

                 <div style={{marginTop:'30px'}}>
                    <p style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color: '#333'}}>Share Badge</p>
                    <div style={shareRow}>
                       <div style={{...socialIcon, background:'#25D366'}}>💬</div>
                       <div style={{...socialIcon, background:'#3b5998'}}>f</div>
                       <div style={{...socialIcon, background:'#1DA1F2'}}>🐦</div>
                       <div style={{...socialIcon, background:'#0088cc'}}>✈️</div>
                       <div style={{...socialIcon, background:'#ea4335'}}>📧</div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER (Mission 100 Style) */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                 <div style={batchTag}>{batchId.toUpperCase()} MISSION...</div>
                 <button onClick={handleMarkAllRead} style={markReadBtn}>Mark All Read</button>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                <div style={dateLabel}>Today</div>
                {notices.map(n => (
                    <div key={n.id} style={notifCardUI}>
                      <div style={iconCircleUI}>
                         <span>{n.content.includes('Class') ? '🎥' : '📢'}</span>
                         {new Date(n.created_at).getTime() > lastReadTime && <div style={redDotNotif} />}
                      </div>
                      <div style={{flex: 1}}>
                         <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <div style={notifTitleUI}>{n.title || "Update"}</div>
                            <div style={notifTimeUI}>{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                         <div style={notifBodyUI}>{n.content}</div>
                         {isOwner && (
                             <div style={{display:'flex', gap:'15px', marginTop:'8px'}}>
                                <button onClick={() => {setEditingNotif(n); setNewNotice(n.content)}} style={textActionBtn}>Edit</button>
                                <button onClick={() => deleteNotice(n.id)} style={textActionBtnRed}>Delete</button>
                             </div>
                         )}
                      </div>
                    </div>
                ))}
              </div>
              {isOwner && (
                <div style={adminPanelNotif}>
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Type update..." style={notifInputUI} />
                   <button onClick={handlePostNotice} style={notifSendBtn}>{editingNotif ? 'Update Notice' : 'Post Notice'}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>{editingEvent ? 'Edit Event' : 'Schedule Event'}</h3>
               <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{...modalInput, marginTop:'10px'}} />
               <button onClick={handleSaveEvent} style={notifSendBtn}>Save Event</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STREAK MODAL STYLES (PIC 3) ---
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' };
const streakCard: any = { width:'380px', background:'#fff', borderRadius:'24px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' };
const streakHeaderBg: any = { background: 'linear-gradient(180deg, #ff9d42 0%, #ff7a00 100%)', height:'160px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' };
const streakCircle: any = { width:'110px', height:'110px', background:'#fff', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'5px solid #f3e5d8', position:'relative', top:'45px', boxShadow:'0 10px 20px rgba(0,0,0,0.1)' };
const streakNumber: any = { fontSize: '48px', fontWeight: '900', color: '#ff7a00' };
const fireSmall: any = { position:'absolute', bottom:'-5px', fontSize:'22px' };
const streakContent: any = { padding:'70px 20px 30px', background:'#fff' };
const streakSub: any = { fontSize:'14px', color:'#666', margin:'5px 0' };
const closeX: any = { position:'absolute', top:'15px', right:'15px', border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#fff', zIndex: 10 };
const shareRow: any = { display:'flex', justifyContent:'center', gap:'12px' };
const socialIcon: any = { width:'42px', height:'42px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold', cursor:'pointer', fontSize: '18px' };

// --- DASHBOARD STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '70px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPillGroup: any = { display: 'flex', gap: '10px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff4d4d', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };
const navAvatar: any = { width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer' };
const contentArea: any = { paddingTop:'110px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'50px', borderRadius:'25px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#333' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const dashboardGrid: any = { display:'flex', gap:'40px', marginTop: '20px' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };

const drawer: any = { width:'450px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'absolute', right: 0 };
const drawerHeader: any = { padding:'25px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const batchTag: any = { background: '#f0f3ff', color: '#6157ff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const markReadBtn: any = { background: '#fff', border: '1px solid #eee', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#666', cursor: 'pointer' };
const dateLabel: any = { fontSize: '13px', color: '#aaa', margin: '20px 0 15px', fontWeight: '600' };

const notifCardUI: any = { display: 'flex', gap: '15px', padding: '15px', borderRadius: '16px', background: '#fcfdfe', border: '1px solid #f1f4f9', marginBottom: '12px' };
const iconCircleUI: any = { position: 'relative', width: '48px', height: '48px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent:'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const redDotNotif: any = { position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', background: '#ff4d4d', borderRadius: '50%', border: '2px solid #fff' };
const notifTitleUI: any = { fontWeight: '700', fontSize: '15px', color: '#111' };
const notifTimeUI: any = { fontSize: '12px', color: '#bbb' };
const notifBodyUI: any = { fontSize: '14px', color: '#666', marginTop: '4px', lineHeight: '1.4' };

const adminPanelNotif: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const notifInputUI: any = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', minHeight: '60px' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const editActionBtn: any = { background: '#f0f7ff', color: '#0070f3', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const deleteActionBtn: any = { background: '#fff1f1', color: '#ff4d4d', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const textActionBtn: any = { background:'none', border:'none', color:'#0070f3', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };
const simBtn: any = { background: '#fff', color: '#333', border: '1px solid #ddd', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', marginLeft: '10px', cursor: 'pointer' };