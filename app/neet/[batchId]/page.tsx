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
  const [streakData, setStreakData] = useState<any>({ current_streak: 0 })
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
      // Syncing with student_stats for profile pic and name
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);
      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (e) { console.error(e); }
  };

  const syncStreak = async () => {
    const email = session?.user?.email;
    let { data } = await supabase.from('user_streaks').select('*').eq('email', email).single();
    if (data) setStreakData(data);
  };

  // --- ACTIONS ---
  const handleLogout = () => signOut({ callbackUrl: '/' });

  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (blob) saveAs(blob, `streak_${streakData.current_streak}_days.png`);
      });
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingRead(true);
    const now = Date.now();
    setTimeout(() => {
        setLastReadTime(now);
        localStorage.setItem(`last_read_${batchId}`, now.toString());
        setIsMarkingRead(false);
    }, 600);
  };

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

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete event?")) return;
    await supabase.from('events').delete().eq('id', id);
    fetchData();
  };

  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin");

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.1, backgroundColor: '#eee' }} whileTap={{ scale: 0.9 }} style={backBtnCircle}>←</motion.div>
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#5b6cfd' }}>StudyHub</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={streakPill} onClick={() => setShowStreakModal(true)}>
                    🔥 {streakData.current_streak || 0}
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={bellContainer} onClick={() => setShowNotifs(true)}>
                    <span style={{fontSize: '18px'}}>🔔</span>
                    {unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </motion.div>
            </div>

            {/* SYNCED PROFILE SECTION */}
            <div style={{ position: 'relative' }}>
              <motion.div whileHover={{ backgroundColor: '#f0f3ff' }} style={profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img 
                  src={userProfile?.avatar_url || session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name}`} 
                  style={navAvatar} 
                />
                <div style={nameWrapper}>
                  <span style={navNameText}>Hi, {userProfile?.student_name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'User'}</span>
                  <span style={navRoleText}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
                </div>
              </motion.div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={dropdownMenu}>
                    <Link href="/profile" style={dropdownItem}>👤 My Profile</Link>
                    <hr style={{ border: '0', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                    <button onClick={handleLogout} style={dropdownLogoutBtn}>🚪 Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main style={contentArea}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <small style={{ opacity: 0.7, letterSpacing: '1px' }}>ACTIVE BATCH</small>
          <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.98 }} style={offeringItem}>
                  <span style={{ fontWeight: '800', color: '#000', fontSize: '16px' }}>{item}</span>
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
              {isOwner && (
                <motion.button whileHover={{ scale: 1.05, backgroundColor: '#5145e5' }} whileTap={{ scale: 0.95 }} onClick={() => {setEditingEvent(null); setEventTitle(""); setEventDate(""); setShowEventModal(true)}} style={addBtn}>+ Create</motion.button>
              )}
            </div>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events.</div> : events.map(ev => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#111' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#6157ff', fontWeight: '600' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && (
                    <div style={{display:'flex', gap:'10px'}}>
                        <motion.button whileHover={{scale:1.1}} onClick={() => {setEditingEvent(ev); setEventTitle(ev.title); setEventDate(ev.event_time.slice(0,16)); setShowEventModal(true)}} style={editActionBtn}>Edit</motion.button>
                        <motion.button whileHover={{scale:1.1}} onClick={() => deleteEvent(ev.id)} style={deleteActionBtn}>Delete</motion.button>
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* STREAK MODAL */}
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
                <p style={{fontSize:'14px', fontWeight:'700', color: '#333', marginBottom:'10px'}}>Share Badge</p>
                <p style={{fontSize:'13px', color: '#666', marginBottom:'20px'}}>Share it to ur friend by downloading it</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDownloadBadge} style={downloadBtnUI}>Download Card</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={batchTagUI}>{batchId.toUpperCase()} MISSION...</div>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={handleMarkAllRead} style={isMarkingRead ? markReadBtnActive : markReadBtnUI}>
                    {isMarkingRead ? '✓ Done' : 'Mark All Read'}
                 </motion.button>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                <div style={dateLabelUI}>Today</div>
                {notices.map(n => (
                    <div key={n.id} style={notifCardUI}>
                      <div style={iconCircleUI}>
                         <span style={{fontSize: '18px'}}>{n.content.includes('Class') ? '🎥' : '📢'}</span>
                         {new Date(n.created_at).getTime() > lastReadTime && <div style={redDotNotif} />}
                      </div>
                      <div style={{flex: 1}}>
                         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
                <div style={adminPanelNotifUI}>
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Type update..." style={notifInputUI} />
                   <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                        <motion.button whileTap={{scale:0.95}} onClick={handlePostNotice} style={notifSendBtn}>{editingNotif ? 'Update Notice' : 'Post Notice'}</motion.button>
                        {editingNotif && <motion.button whileTap={{scale:0.95}} onClick={() => {setEditingNotif(null); setNewNotice("")}} style={cancelTextBtn}>Cancel</motion.button>}
                   </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>{editingEvent ? 'Edit Event' : 'Schedule Event'}</h3>
               <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{...modalInput, marginTop:'10px'}} />
               <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleSaveEvent} style={notifSendBtn}>Save Event</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- SYNCED STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '75px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '15px' };
const navAvatar: any = { width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };
const navNameText: any = { fontSize: '14px', fontWeight: '800', color: '#5b6cfd', lineHeight: '1.2' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '0.5px' };

const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.12)', borderRadius: '16px', padding: '8px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '10px', textDecoration: 'none' };
const dropdownLogoutBtn: any = { padding: '12px 15px', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '14px', fontWeight: '800', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' };

const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };
const contentArea: any = { paddingTop:'115px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'50px', borderRadius:'30px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#111' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer' };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const statPillGroup: any = { display: 'flex', gap: '10px', alignItems: 'center' };
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };
const streakCard: any = { width:'380px', background:'#fff', borderRadius:'24px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' };
const streakHeaderBg: any = { background: 'linear-gradient(180deg, #ff9d42 0%, #ff7a00 100%)', height:'160px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' };
const streakCircle: any = { width:'110px', height:'110px', background:'#fff', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'5px solid #f3e5d8', position:'relative', top:'45px' };
const streakNumber: any = { fontSize: '48px', fontWeight: '900', color: '#ff7a00' };
const fireSmall: any = { position:'absolute', bottom:'-5px', fontSize:'22px' };
const streakContent: any = { padding:'70px 20px 30px', background:'#fff' };
const streakSub: any = { fontSize:'14px', color:'#666', margin:'5px 0' };
const closeX: any = { position:'absolute', top:'15px', right:'15px', border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#fff', zIndex: 10 };
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
const notifTitleUI: any = { fontWeight: '800', fontSize: '15px', color: '#111' };
const notifTimeUI: any = { fontSize: '12px', color: '#bbb' };
const notifBodyUI: any = { fontSize: '14px', color: '#666', marginTop: '4px', lineHeight: '1.4' };
const adminPanelNotifUI: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const notifInputUI: any = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', minHeight: '60px' };
const notifSendBtn: any = { flex: 1, padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };
const cancelTextBtn: any = { padding: '12px 20px', background: '#eee', color: '#666', border: 'none', borderRadius: '10px', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const editActionBtn: any = { background: '#f0f7ff', color: '#0070f3', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const deleteActionBtn: any = { background: '#fff', color: '#ff4d4d', border: '1px solid #ffcccc', padding: '8px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' };
const textActionBtn: any = { background:'none', border:'none', color:'#0070f3', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };