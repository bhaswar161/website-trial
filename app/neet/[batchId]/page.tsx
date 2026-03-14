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
  
  // Profile Sync States
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");

  // Streak & Timer Logic
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isStreakAchieved, setIsStreakAchieved] = useState(false);

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
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  const [newNotice, setNewNotice] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")

  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []); 
  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    const updateFromLocal = () => {
      setLocalName(localStorage.getItem("userFirstName") || "");
      setLocalPic(localStorage.getItem("userProfilePic") || "");
      setStreak(parseInt(localStorage.getItem("userStreak") || "0"));
    };
    const saved = localStorage.getItem(`last_read_${batchId}`);
    if (saved) setLastReadTime(parseInt(saved));
    updateFromLocal();

    const interval = setInterval(() => {
      setStudySeconds(s => {
        if (s >= 600 && !isStreakAchieved) {
            const ns = streak + 1;
            setStreak(ns);
            setIsStreakAchieved(true);
            localStorage.setItem("userStreak", ns.toString());
            localStorage.setItem("lastStudyDate", new Date().toDateString());
        }
        return s + 1;
      });
    }, 1000);

    if (session?.user?.email) fetchData();
    return () => clearInterval(interval);
  }, [batchId, session, isStreakAchieved]);

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

  const handlePostNotice = async () => {
    if (!newNotice.trim()) return;
    if (editingNotif) {
      await supabase.from('notices').update({ content: newNotice.trim() }).eq('id', editingNotif.id);
    } else {
      await supabase.from('notices').insert([{ batch_id: batchId, title: "Announcement", content: newNotice.trim() }]);
    }
    setNewNotice(""); setEditingNotif(null); fetchData();
  };

  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return;
    if (editingEvent) {
      await supabase.from('events').update({ title: eventTitle, event_time: eventDate }).eq('id', editingEvent.id);
    } else {
      await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]);
    }
    setShowEventModal(false); setEditingEvent(null); setEventTitle(""); setEventDate(""); fetchData();
  };

  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => { if (blob) saveAs(blob, `streak_${streak}.png`); });
    }
  };

  const finalDisplayName = localName || userProfile?.student_name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || "User";
  const finalDisplayPic = localPic || userProfile?.avatar_url || session?.user?.image || `https://ui-avatars.com/api/?name=${finalDisplayName}`;
  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;
  const rainbowColors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"];

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.1, backgroundColor: '#f5f5f5' }} whileTap={{ scale: 0.9 }} style={backBtnCircle}>←</motion.div>
            </Link>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={streakPill} onClick={() => setShowStreakModal(true)}>
                    🔥 {streak}
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={bellContainer} onClick={() => setShowNotifs(true)}>
                    <span style={{fontSize: '18px'}}>🔔</span>
                    {unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </motion.div>
            </div>
            <div style={{ position: 'relative' }}>
              <motion.div whileHover={{ backgroundColor: '#f0f3ff' }} style={profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img src={finalDisplayPic} style={navAvatar} />
                <div style={nameWrapper}>
                  <span style={navNameText}>Hi, {finalDisplayName}</span>
                  <span style={navRoleText}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
                </div>
              </motion.div>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={dropdownMenu}>
                    <Link href="/profile" style={dropdownItem}>👤 My Profile</Link>
                    <hr style={{ border: '0', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                    <button onClick={() => signOut({ callbackUrl: '/' })} style={dropdownLogoutBtn}>🚪 Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main style={contentArea}>
        {/* GAP FIXED: Content area has 170px PaddingTop */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <div style={bannerDots} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <small style={{ opacity: 0.8, letterSpacing: '1px', fontWeight: '700' }}>YOUR BATCH</small>
            <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>{batchId.toUpperCase()} MISSION...</h2>
            <div style={studyGoalText}>Study 10 mins to grow streak: <b>{Math.floor(studySeconds/60)}/10m</b></div>
          </div>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 24px rgba(91, 108, 253, 0.12)' }} style={offeringItem}>
                  <span style={{ fontWeight: '800', color: '#000', fontSize: '16px' }}>{item}</span>
                  <div style={arrowCircle}>❯</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        <div style={dashboardGrid}>
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <motion.button whileHover={{ scale: 1.05, backgroundColor: '#5145e5' }} onClick={() => {setEditingEvent(null); setShowEventModal(true)}} style={addBtn}>+ Create Event</motion.button>}
            </div>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events.</div> : events.map(ev => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#111' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#5b6cfd', fontWeight: '600' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && (
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={() => {setEditingEvent(ev); setEventTitle(ev.title); setEventDate(ev.event_time.slice(0,16)); setShowEventModal(true)}} style={textActionBtn}>Edit</button>
                        <button onClick={() => {if(confirm("Delete?")) supabase.from('events').delete().eq('id', ev.id).then(() => fetchData())}} style={textActionBtnRed}>Delete</button>
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalOverlay} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} style={streakCardPremium} onClick={e => e.stopPropagation()}>
              <button style={closeX} onClick={() => setShowStreakModal(false)}>✕</button>
              
              <div ref={badgeRef} style={{background:'#fff', borderRadius:'35px', overflow:'hidden'}}>
                {/* STARS PLACED ONLY ON GRADIENT BEHIND CIRCLE */}
                <motion.div 
                    animate={{ background: ['linear-gradient(135deg, #5b6cfd, #9c42f5)', 'linear-gradient(135deg, #9c42f5, #ff5b84)', 'linear-gradient(135deg, #5b6cfd, #9c42f5)'] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={streakCircleHeader}
                >
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.2, 1, 0], scale: [0.5, 1.2, 0.5], y: [0, (Math.random()-0.5)*150], x: [(Math.random()-0.5)*150], color: rainbowColors }}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                          style={{ position: 'absolute', top: '50%', left: '50%', fontSize: '18px', zIndex: 1, filter:'drop-shadow(0 0 5px currentColor)' }}
                        >✨</motion.div>
                    ))}
                    <motion.div animate={{ scale: [1, 1.05, 1] }} style={streakMainVal}>
                        {streak} <small style={{fontSize:'12px', display:'block', color:'#888'}}>DAYS</small>
                    </motion.div>
                </motion.div>

                <div style={streakInfoBody}>
                    <h2 style={{margin:'0', fontWeight:'900', color:'#111'}}>Magic Streak!</h2>
                    <p style={{color:'#666', fontSize:'14px', marginTop: '8px'}}>10 minutes of daily study keeps the magic flowing.</p>
                </div>
              </div>
              <div style={shareSectionUI}>
                <motion.button whileHover={{ scale: 1.02 }} onClick={handleDownloadBadge} style={downloadBtnUI}>Download Badge</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={batchTagUI}>{batchId.toUpperCase()}...</div>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => {setLastReadTime(Date.now()); localStorage.setItem(`last_read_${batchId}`, Date.now().toString())}} style={markReadBtnUI}>Mark All Read</motion.button>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                {notices.map(n => (
                    <div key={n.id} style={notifCardUI}>
                      <div style={{flex: 1}}>
                         <div style={{fontWeight:'800'}}>{n.title}</div>
                         <div style={{fontSize:'14px', color:'#666', marginTop:'4px'}}>{n.content}</div>
                         {isOwner && (
                             <div style={{display:'flex', gap:'15px', marginTop:'10px'}}>
                                <button onClick={() => {setEditingNotif(n); setNewNotice(n.content)}} style={textActionBtn}>Edit</button>
                                <button onClick={() => {if(confirm("Delete?")) supabase.from('notices').delete().eq('id', n.id).then(() => fetchData())}} style={textActionBtnRed}>Delete</button>
                             </div>
                         )}
                      </div>
                    </div>
                ))}
              </div>
              {isOwner && (
                <div style={adminPanelNotifUI}>
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Post notice..." style={notifInputUI} />
                   <button onClick={handlePostNotice} style={notifSendBtn}>{editingNotif ? 'Update' : 'Post'}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>{editingEvent ? 'Edit Event' : 'Schedule Event'}</h3>
               <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{...modalInput, marginTop:'10px'}} />
               <motion.button whileHover={{scale:1.02}} onClick={handleSaveEvent} style={notifSendBtn}>Save Event</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- ALL STYLE DEFINITIONS ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '80px' };
const headerInner: any = { maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 25px' };
const contentArea: any = { paddingTop:'170px', maxWidth:'1200px', margin:'0 auto', paddingBottom:'60px' };

const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'80px 60px', borderRadius:'30px 30px 100px 30px', marginBottom:'50px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' };
const bannerDots: any = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' };
const studyGoalText: any = { marginTop:'20px', background:'rgba(255,255,255,0.1)', padding:'8px 16px', borderRadius:'10px', display:'inline-block', fontSize:'13px' };

const statPillGroup: any = { display: 'flex', gap: '12px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '14px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };

const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '15px' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2.5px solid #5b6cfd', objectFit: 'cover' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '0.6px' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };

const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'30px', background:'#fff', borderRadius:'30px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer' };
const arrowCircle: any = { width: '32px', height: '32px', borderRadius: '50%', background: '#f5f7ff', color: '#5b6cfd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' };
const sectionTitle: any = { fontSize:'20px', fontWeight:'900', margin:'0 0 25px' };

const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter: 'blur(4px)' };
const streakCardPremium: any = { width:'400px', background:'#fff', borderRadius:'40px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 30px 60px rgba(0,0,0,0.3)' };
const streakCircleHeader: any = { height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', position:'relative' };
const streakMainVal: any = { width: '120px', height: '120px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '900', color: '#5b6cfd', zIndex: 2, position:'relative' };
const streakInfoBody: any = { padding: '30px 20px', background: '#fff' };
const shareSectionUI: any = { padding: '20px 20px 30px', background: '#fcfdfe', borderTop: '1px solid #eee' };
const downloadBtnUI: any = { width: '100%', padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' };

const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0', display:'flex', flexDirection:'column' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', display: 'block' };
const dropdownLogoutBtn: any = { width:'100%', textAlign:'left', padding: '12px 15px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderRadius: '12px', cursor: 'pointer' };

const drawerUI: any = { width:'460px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'absolute', right: 0 };
const drawerHeaderUI: any = { padding:'30px 25px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const batchTagUI: any = { background: '#f0f3ff', color: '#6157ff', padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' };
const markReadBtnUI: any = { background: '#fff', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#4a5568', cursor: 'pointer' };
const notifCardUI: any = { padding: '20px', borderRadius: '25px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '12px', display:'flex' };
const adminPanelNotifUI: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const notifInputUI: any = { width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', fontSize: '14px', minHeight: '80px' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };

const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const textActionBtn: any = { background:'none', border:'none', color:'#0070f3', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'25px', borderRadius:'30px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };
const closeX: any = { position:'absolute', top:'20px', right:'20px', border:'none', background:'none', fontSize:'22px', cursor:'pointer', color:'#fff', zIndex: 10 };