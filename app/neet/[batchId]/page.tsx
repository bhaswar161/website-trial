"use client";
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useMemo, useRef, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

// Define the type for the dynamic route params
type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  // Fix for Next.js 15 Async Params
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;

  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null);
  
  // States
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)

  // Admin Inputs
  const [newNotice, setNewNotice] = useState("")
  const [noticeSubject, setNoticeSubject] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [editingNotif, setEditingNotif] = useState<any>(null)

  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []); 
  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    const syncProfile = () => {
      setLocalName(localStorage.getItem("userFirstName") || "");
      setLocalPic(localStorage.getItem("userProfilePic") || "");
      setStreak(parseInt(localStorage.getItem("userStreak") || "0"));
      const saved = localStorage.getItem(`last_read_${batchId}`);
      if (saved) setLastReadTime(parseInt(saved));
    };
    syncProfile();

    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    supabase.from('student_stats').select('*').eq('email', session?.user?.email).single().then(({data}) => setUserProfile(data));
    supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false }).then(({data}) => setNotices(data || []));
    
    // Fetch only active events
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    setEvents(eData?.filter((ev: any) => !ev.is_done) || []);
  };

  // --- ACTIONS ---

  const handlePostNotice = async () => {
    if (!newNotice.trim() || !noticeSubject.trim()) return;
    const nData = { batch_id: batchId, title: noticeSubject, content: newNotice.trim() };
    if (editingNotif) {
      await supabase.from('notices').update(nData).eq('id', editingNotif.id);
    } else {
      await supabase.from('notices').insert([nData]);
    }
    setNewNotice(""); setNoticeSubject(""); setEditingNotif(null); fetchData();
  };

  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return;
    const newEv = { batch_id: batchId, title: eventTitle, event_time: eventDate, is_done: false };
    const { error } = await supabase.from('events').insert([newEv]);
    if (!error) {
      await supabase.from('notices').insert([{ batch_id: batchId, title: "New Event", content: `${eventTitle} scheduled!` }]);
      setShowEventModal(false); setEventTitle(""); setEventDate(""); fetchData();
    }
  };

  // FIXED: Added missing handleDoneDismiss
  const handleDoneDismiss = async (ev: any) => {
    await supabase.from('events').update({ is_done: true }).eq('id', ev.id);
    await supabase.from('notices').insert([{ batch_id: batchId, title: "Task Done", content: `Event "${ev.title}" completed!` }]);
    fetchData();
  };

  // FIXED: Added missing handleDownloadBadge
  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2 });
      canvas.toBlob((blob) => { if (blob) saveAs(blob, `streak_${streak}.png`); });
    }
  };

  const finalDisplayName = localName || session?.user?.name?.split(' ')[0] || "User";
  const finalDisplayPic = localPic || userProfile?.avatar_url || session?.user?.image || `https://ui-avatars.com/api/?name=${finalDisplayName}`;
  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}><motion.div whileHover={{x:-3}} style={backBtnCircle}>←</motion.div></Link>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                <motion.div whileHover={{ scale: 1.05 }} style={streakPill} onClick={() => setShowStreakModal(true)}>🔥 {streak}</motion.div>
                <div style={bellContainer} onClick={() => setShowNotifs(true)}>
                    <span>🔔</span>{unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img src={finalDisplayPic} style={navAvatar} />
                <div style={nameWrapper}>
                  <span style={navNameText}>Hi, {finalDisplayName}</span>
                  <span style={navRoleText}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
                </div>
              </div>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={dropdownMenu}>
                    <Link href="/profile" style={dropdownItem}>👤 My Profile</Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} style={dropdownLogoutBtn}>🚪 Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main style={contentArea}>
        <div style={batchBanner}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', color:'#fff' }}>{batchId.toUpperCase()} MISSION</h2>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <div key={item} style={offeringItem}>
                <span style={{ fontWeight: '800' }}>{item}</span>
                <div style={arrowCircle}>❯</div>
              </div>
            ))}
          </div>
        </section>

        <div style={dashboardGrid}>
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => setShowEventModal(true)} style={addBtn}>+ Create Event</button>}
            </div>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events.</div> : events.map(ev => (
              <div key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800' }}>{ev.title}</div>
                    <div style={{ fontSize: '12px' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && (
                  <div style={{display:'flex', gap:'10px'}}>
                    <motion.button whileTap={{scale:0.9}} onClick={() => handleDoneDismiss(ev)} style={{...textActionBtn, color:'#22c55e'}}>✓ Done</motion.button>
                    <button onClick={() => supabase.from('events').delete().eq('id', ev.id).then(()=>fetchData())} style={textActionBtnRed}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={{fontSize:'20px', fontWeight:'800'}}>Notifications</div>
                 <button onClick={() => setShowNotifs(false)} style={markReadBtnUI}>Close</button>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                {notices.map(n => (
                    <div key={n.id} style={notifCardUI}>
                      <div style={{flex: 1}}>
                         <div style={{fontWeight:'800', color:'#5b6cfd'}}>{n.title}</div>
                         <div style={{fontSize:'14px'}}>{n.content}</div>
                         {isOwner && <button onClick={() => {setEditingNotif(n); setNoticeSubject(n.title); setNewNotice(n.content)}} style={textActionBtn}>Edit</button>}
                      </div>
                    </div>
                ))}
              </div>
              {isOwner && (
                <div style={adminPanelNotifUI}>
                   <input value={noticeSubject} onChange={e=>setNoticeSubject(e.target.value)} placeholder="Subject" style={subjectInputUI} />
                   <textarea value={newNotice} onChange={e=>setNewNotice(e.target.value)} placeholder="Message" style={notifInputUI} />
                   <button onClick={handlePostNotice} style={notifSendBtn}>Post Notice</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>Create Event</h3>
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

// --- STYLE DEFINITIONS (Fixes Terminal Errors) ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '80px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
const headerInner: any = { maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 25px' };
const contentArea: any = { paddingTop:'180px', maxWidth:'1200px', margin:'0 auto', paddingBottom:'60px' };
const statPillGroup: any = { display: 'flex', gap: '12px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '14px', cursor: 'pointer' };
const bellBadge: any = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };
const batchBanner: any = { background:'#1c252e', padding:'60px', borderRadius:'30px', marginBottom:'40px' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'30px', background:'#fff', borderRadius:'30px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer' };
const sectionTitle: any = { fontSize:'22px', fontWeight:'900', margin:'0 0 25px' };
const arrowCircle: any = { width: '32px', height: '32px', borderRadius: '50%', background: '#f5f7ff', color: '#5b6cfd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'25px', borderRadius:'30px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const textActionBtn: any = { background:'none', border:'none', color:'#5b6cfd', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter: 'blur(4px)' };
const drawerUI: any = { width:'460px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', position: 'absolute', right: 0 };
const drawerHeaderUI: any = { padding:'30px 25px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const markReadBtnUI: any = { background: '#f0f3ff', border: '1px solid #e0e7ff', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#5b6cfd', cursor: 'pointer' };
const notifCardUI: any = { padding: '20px', borderRadius: '25px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '12px' };
const adminPanelNotifUI: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const subjectInputUI: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #eee', marginBottom:'10px', fontSize:'14px' };
const notifInputUI: any = { width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', fontSize: '14px', minHeight: '80px' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };
const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.12)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0', display:'flex', flexDirection:'column' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', display: 'block' };
const dropdownLogoutBtn: any = { width:'100%', textAlign:'left', padding: '12px 15px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderRadius: '12px', cursor: 'pointer' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' };
const streakCardPremium: any = { width:'400px', background:'#fff', borderRadius:'40px' };
const progressBarBg: any = { width:'100%', height:'8px', background:'#f0f0f0', borderRadius:'10px', marginTop:'15px' };
const progressBarFill: any = { height:'100%', background:'#5b6cfd' };