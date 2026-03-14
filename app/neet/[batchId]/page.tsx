"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect, useMemo, use, useRef } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null);
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false);
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
    let { data } = await supabase.from('user_streaks').select('*').eq('email', email).single();
    if (!data) return;
    const lastDate = data.last_activity_date;
    const diffInDays = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
    let currentStreak = data.current_streak;
    if (diffInDays > 1) currentStreak = 0; 
    setStreakData({ ...data, current_streak: currentStreak });
  };

  const handleWatchProgress = async (mins: number) => {
    if (streakData.achieved_today) return;
    const newMins = (streakData.mins_watched_today || 0) + mins;
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

  // --- DOWNLOAD LOGIC ---
  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (blob) saveAs(blob, `streak_${streakData.current_streak}_days.png`);
      });
    }
  };

  // --- MARK ALL READ ANIMATED LOGIC ---
  const handleMarkAllRead = async () => {
    setIsMarkingRead(true);
    const now = Date.now();
    setTimeout(() => {
        setLastReadTime(now);
        localStorage.setItem(`last_read_${batchId}`, now.toString());
        setIsMarkingRead(false);
    }, 600);
  };

  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  // --- DATABASE ACTIONS ---
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

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800' }}>Study Hub</h1>
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
        <div style={batchBanner}>
          <h2 style={{ fontSize: '32px', fontWeight: '900' }}>{batchId.toUpperCase()}</h2>
          <div style={{marginTop: '10px', fontSize: '14px'}}>
             Watch Progress: <b>{streakData.mins_watched_today || 0} / 10 mins</b>
             <button onClick={() => handleWatchProgress(5)} style={simBtn}>+5m Test</button>
          </div>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <div style={offeringItem}>
                  <span style={{ fontWeight: '700' }}>{item}</span>
                  <span style={{ color: '#6157ff' }}>❯</span>
                </div>
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
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* STREAK MODAL (Downloadable) */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={streakCard} onClick={e => e.stopPropagation()}>
              <button style={closeX} onClick={() => setShowStreakModal(false)}>✕</button>
              
              <div ref={badgeRef} style={{background:'#fff'}}>
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
                </div>
              </div>

              <div style={shareSectionUI}>
                <p style={{fontSize:'14px', fontWeight:'700', color: '#333', marginBottom:'15px'}}>Share Badge</p>
                <p style={{fontSize:'13px', color: '#666', marginBottom:'20px'}}>Share it to ur friend by downloading it</p>
                <button onClick={handleDownloadBadge} style={downloadBtnUI}>Download Card</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER (Animated Mark Read) */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={batchTagUI}>ULTIMATE-2026 MISSION...</div>
                 <motion.button 
                    whileTap={{ scale: 0.9 }} 
                    onClick={handleMarkAllRead} 
                    style={isMarkingRead ? markReadBtnActive : markReadBtnUI}
                 >
                    {isMarkingRead ? '✓ Done' : 'Mark All Read'}
                 </motion.button>
              </div>

              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                <div style={dateLabelUI}>Today</div>
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
                      </div>
                    </div>
                ))}
              </div>
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

// --- STYLES ---
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' };
const streakCard: any = { width:'380px', background:'#fff', borderRadius:'24px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' };
const streakHeaderBg: any = { background: 'linear-gradient(180deg, #ff9d42 0%, #ff7a00 100%)', height:'160px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' };
const streakCircle: any = { width:'110px', height:'110px', background:'#fff', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'5px solid #f3e5d8', position:'relative', top:'45px', boxShadow:'0 10px 20px rgba(0,0,0,0.1)' };
const streakNumber: any = { fontSize: '48px', fontWeight: '900', color: '#ff7a00' };
const fireSmall: any = { position:'absolute', bottom:'-5px', fontSize:'22px' };
const streakContent: any = { padding:'70px 20px 30px', background:'#fff' };
const streakSub: any = { fontSize:'14px', color:'#666', margin:'5px 0' };
const shareSectionUI: any = { padding: '20px 20px 30px', background: '#fcfdfe', borderTop: '1px solid #eee' };
const downloadBtnUI: any = { width: '100%', background: '#6157ff', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

const drawerUI: any = { width:'460px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'absolute', right: 0 };
const drawerHeaderUI: any = { padding:'30px 25px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const batchTagUI: any = { background: '#f0f3ff', color: '#6157ff', padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' };
const markReadBtnUI: any = { background: '#fff', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#4a5568', cursor: 'pointer' };
const markReadBtnActive: any = { background: '#6157ff', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' };

const dateLabelUI: any = { fontSize: '14px', color: '#94a3b8', margin: '20px 0 15px', fontWeight: '700' };
const notifCardUI: any = { display: 'flex', gap: '15px', padding: '18px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '12px' };
const iconCircleUI: any = { position: 'relative', width: '50px', height: '50px', borderRadius: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent:'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const redDotNotif: any = { position: 'absolute', top: '0', right: '0', width: '9px', height: '9px', background: '#ff4d4d', borderRadius: '50%', border: '2px solid #fff' };

const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '70px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPillGroup: any = { display: 'flex', gap: '10px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff4d4d', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };
const navAvatar: any = { width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer' };
const contentArea: any = { paddingTop:'110px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'40px', borderRadius:'25px', marginBottom:'40px' };
const closeX: any = { position:'absolute', top:'15px', right:'15px', border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#fff', zIndex: 10 };
const simBtn: any = { background: '#fff', color: '#333', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '10px', cursor: 'pointer' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#333' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const dashboardGrid: any = { display:'flex', gap:'40px', marginTop: '20px' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const notifTitleUI: any = { fontWeight: '700', fontSize: '15px', color: '#111' };
const notifTimeUI: any = { fontSize: '12px', color: '#bbb' };
const notifBodyUI: any = { fontSize: '14px', color: '#666', marginTop: '4px', lineHeight: '1.4' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const editActionBtn: any = { background: '#f0f7ff', color: '#0070f3', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const deleteActionBtn: any = { background: '#fff1f1', color: '#ff4d4d', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };