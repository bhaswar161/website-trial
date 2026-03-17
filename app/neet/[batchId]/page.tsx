"use client";
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useMemo, useRef, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { useRouter } from "next/navigation"
import { useTheme } from "../../../context/ThemeContext"

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const { data: session, status } = useSession()
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Logic & Profile Sync States
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isStreakAchieved, setIsStreakAchieved] = useState(false);

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  // Admin Input States
  const [newNotice, setNewNotice] = useState("")
  const [noticeSubject, setNoticeSubject] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [editingNotif, setEditingNotif] = useState<any>(null)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []); 
  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    const syncProfile = () => {
      setLocalName(localStorage.getItem("userFirstName") || "");
      setLocalPic(localStorage.getItem("userProfilePic") || "");
      setStreak(parseInt(localStorage.getItem("userStreak") || "0"));
      
      const today = new Date().toDateString();
      const lastStudyDate = localStorage.getItem("lastStudyDate");
      
      if (lastStudyDate !== today) {
        setStudySeconds(0);
        setIsStreakAchieved(false);
        localStorage.setItem("lastStudyDate", today);
        localStorage.setItem("studySecondsToday", "0");
      } else {
          const savedSeconds = parseInt(localStorage.getItem("studySecondsToday") || "0");
          setStudySeconds(savedSeconds);
          if (savedSeconds >= 600) setIsStreakAchieved(true);
      }

      const saved = localStorage.getItem(`last_read_${batchId}`);
      if (saved) setLastReadTime(parseInt(saved));
    };
    syncProfile();

    const interval = setInterval(() => {
      setStudySeconds(s => {
        if (s < 600) { 
            const ns = s + 1;
            localStorage.setItem("studySecondsToday", ns.toString());
            if (ns >= 600 && !isStreakAchieved) {
                const newVal = streak + 1;
                setStreak(newVal);
                setIsStreakAchieved(true);
                localStorage.setItem("userStreak", newVal.toString());
            }
            return ns;
        }
        return s; 
      });
    }, 1000);

    if (session?.user?.email) fetchData();
    return () => clearInterval(interval);
  }, [batchId, session, isStreakAchieved, streak]);

  const fetchData = async () => {
    supabase.from('student_stats').select('*').eq('email', session?.user?.email).single().then(({data}) => setUserProfile(data));
    supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false }).then(({data}) => setNotices(data || []));
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    setEvents(eData?.filter((ev: any) => !ev.is_done) || []);
  };

  // --- ACTIONS ---
  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return;
    const evPayload = { batch_id: batchId, title: eventTitle, event_time: eventDate, is_done: false };
    if (editingEvent) {
      await supabase.from('events').update(evPayload).eq('id', editingEvent.id);
      await supabase.from('notices').insert([{ batch_id: batchId, title: "🔄 Event Updated", content: `"${eventTitle}" reschedule details: ${new Date(eventDate).toLocaleString()}` }]);
    } else {
      await supabase.from('events').insert([evPayload]);
      await supabase.from('notices').insert([{ batch_id: batchId, title: "📅 New Event Added", content: `${eventTitle} is scheduled for ${new Date(eventDate).toLocaleString()}` }]);
    }
    setShowEventModal(false); setEventTitle(""); setEventDate(""); setEditingEvent(null); fetchData();
  };

  const handleEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(new Date(ev.event_time).toISOString().slice(0, 16));
    setShowEventModal(true);
  };

  const handleDoneDismiss = async (ev: any) => {
    await supabase.from('events').update({ is_done: true }).eq('id', ev.id);
    await supabase.from('notices').insert([{ batch_id: batchId, title: "✅ Mission Accomplished", content: `Excellent! The task "${ev.title}" is finished.` }]);
    fetchData();
  };

  const handleDeleteEvent = async (ev: any) => {
    if(confirm("Delete this event?")) {
        await supabase.from('events').delete().eq('id', ev.id);
        await supabase.from('notices').insert([{ batch_id: batchId, title: "🚫 Event Removed", content: `The scheduled event "${ev.title}" was deleted.` }]);
        fetchData();
    }
  };

  const handlePostNotice = async () => {
    if (!newNotice.trim() || !noticeSubject.trim()) return;
    const nData = { batch_id: batchId, title: noticeSubject, content: newNotice.trim() };
    if (editingNotif) { await supabase.from('notices').update(nData).eq('id', editingNotif.id); } 
    else { await supabase.from('notices').insert([nData]); }
    setNewNotice(""); setNoticeSubject(""); setEditingNotif(null); fetchData();
  };

  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 3, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', useCORS: true });
      canvas.toBlob((blob) => { if (blob) saveAs(blob, `Streak_${streak}Days.png`); });
    }
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    header: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    card: isDarkMode ? '#1e293b' : '#fff',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    subtext: isDarkMode ? '#94a3b8' : '#64748b'
  };

  const finalDisplayName = localName || session?.user?.name?.split(' ')[0] || "User";
  const finalDisplayPic = localPic || userProfile?.avatar_url || session?.user?.image || `https://ui-avatars.com/api/?name=${finalDisplayName}`;
  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'sans-serif', transition: '0.4s' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; list-style: none; text-decoration: none; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 0 5%; background: ${theme.header}; backdrop-filter: blur(15px); border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 1000; height: 80px; }
        .nav-center ul { display: flex; gap: 25px; align-items: center; }
        .home-btn { border: 2px solid #5b6cfd; color: #5b6cfd; padding: 8px 25px; border-radius: 12px; font-weight: 800; font-size: 16px; transition: 0.2s; background: rgba(91, 108, 253, 0.05); }
        .admin-btn { background: #ffebeb; color: #ff4757; border: 2px solid #ff4757; padding: 8px 18px; border-radius: 12px; font-weight: 800; transition: 0.3s; }
        .admin-btn:hover { background: #ff4757; color: white; }
        .streak-pill { background: ${isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff5f5'}; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 15px; border-radius: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ef4444; font-weight: bold; }
        .notif-bell { background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f9ff'}; padding: 10px; border-radius: 12px; border: 1px solid ${theme.border}; cursor: pointer; position: relative; }
        .bell-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 900; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .profile-pill { display: flex; align-items: center; gap: 12px; background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}; padding: 6px 16px 6px 6px; border-radius: 50px; color: inherit; }
        .back-link { color: #5b6cfd; font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; cursor: pointer; border: none; background: none; }
        .offering-card { padding: 30px; background: ${theme.card}; border-radius: 25px; border: 1px solid ${theme.border}; color: ${theme.text}; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
        .offering-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
      `}} />

      <header>
        <Link href="/" style={{ fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>
        <nav className="nav-center">
          <ul>
            <li><Link href="/" className="home-btn">Home</Link></li>
            {isOwner && <li><Link href="/admin" className="admin-btn">Admin Panel</Link></li>}
            <li><Link href="#" style={{color: theme.text, fontWeight: 600}}>Books</Link></li>
            <li><Link href="#" style={{color: theme.text, fontWeight: 600}}>Results</Link></li>
          </ul>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div className="streak-pill" onClick={() => setShowStreakModal(true)}>🔥 {streak}</div>
          <div className="notif-bell" onClick={() => { setShowNotifs(true); setLastReadTime(Date.now()); localStorage.setItem(`last_read_${batchId}`, Date.now().toString()); }}>
            🔔 {unreadCount > 0 && <div className="bell-badge">{unreadCount}</div>}
          </div>
          <div style={{ position: 'relative' }}>
            <div className="profile-pill" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{cursor:'pointer'}}>
                <img src={finalDisplayPic} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' }} />
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: theme.text }}>Hi, {finalDisplayName}</div>
                    <div style={{ fontSize: '9px', color: '#5b6cfd', fontWeight: '900' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
                </div>
            </div>
            {showProfileMenu && (
                <div style={{ position: 'absolute', top: '55px', right: 0, background: theme.card, padding: '15px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 100, border: `1px solid ${theme.border}`, minWidth: '150px' }}>
                    <Link href="/profile" style={{ color: theme.text, display:'block', marginBottom:'10px' }}>My Profile</Link>
                    <button onClick={() => signOut()} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
                </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <button onClick={() => router.push('/')} className="back-link">
          <motion.span animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1.5 }}>←</motion.span> Back to Home
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          style={{ background: isDarkMode ? '#1e293b' : '#1c252e', color: '#fff', padding: '80px 60px', borderRadius: '30px 30px 100px 30px', marginBottom: '50px', position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>{batchId.toUpperCase()} MISSION</h2>
          <p style={{ opacity: 0.7, marginTop: '10px', fontSize: '18px' }}>Crack NEET with StudyHub's premium batch curriculum.</p>
        </motion.div>

        <section style={{ marginBottom: '60px' }}>
          <h3 style={{ color: theme.text, fontSize: '24px', fontWeight: '900', marginBottom: '30px' }}>Batch Offerings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px' }}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} className="offering-card">
                <span style={{ fontWeight: '800' }}>{item}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isDarkMode ? '#334155' : '#f5f7ff', color: '#5b6cfd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❯</div>
              </Link>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '350px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '25px' }}>
              <h3 style={{ color: theme.text, fontSize:'24px', fontWeight:'900' }}>Upcoming Events</h3>
              {isOwner && <button onClick={() => {setEditingEvent(null); setShowEventModal(true)}} style={{ background: '#5b6cfd', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>+ Create Event</button>}
            </div>
            {events.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: theme.subtext, background: theme.card, borderRadius: '30px', border: `1px solid ${theme.border}` }}>🕒 No upcoming events scheduled.</div> : events.map(ev => (
              <div key={ev.id} style={{ background: theme.card, padding: '25px', borderRadius: '30px', marginBottom: '15px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', color: theme.text, fontSize: '18px' }}>{ev.title}</div>
                  <div style={{ fontSize: '13px', color: theme.subtext, marginTop: '5px' }}>📅 {new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && (
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={() => handleEditEvent(ev)} style={{ color: '#5b6cfd', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDoneDismiss(ev)} style={{ color: '#22c55e', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Done</button>
                        <button onClick={() => handleDeleteEvent(ev)} style={{ color: '#ef4444', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'flex-end', backdropFilter:'blur(4px)' }} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{ width:'450px', background: theme.card, height:'100%', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding:'30px', borderBottom: `1px solid ${theme.border}`, display:'flex', justifyContent:'space-between' }}>
                <h2 style={{ color: theme.text, fontWeight: '900' }}>Notifications</h2>
                <button onClick={() => setShowNotifs(false)} style={{ background:'#eee', border:'none', padding:'5px 15px', borderRadius:'10px', cursor:'pointer' }}>Close</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {notices.map(n => (
                  <div key={n.id} style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, position:'relative' }}>
                    <div style={{ fontWeight: '800', color: '#5b6cfd' }}>{n.title}</div>
                    <div style={{ color: theme.text, fontSize: '14px', marginTop: '5px' }}>{n.content}</div>
                    <div style={{ fontSize: '10px', color: theme.subtext, marginTop: '10px' }}>{new Date(n.created_at).toLocaleString()}</div>
                    {isOwner && <button onClick={() => supabase.from('notices').delete().eq('id', n.id).then(()=>fetchData())} style={{ color: '#ef4444', position: 'absolute', top: 20, right: 0, background: 'none', border: 'none', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>}
                  </div>
                ))}
              </div>
              {isOwner && (
                <div style={{ padding: '20px', background: isDarkMode ? '#0f172a' : '#fcfdfe', borderTop: `1px solid ${theme.border}` }}>
                    <input value={noticeSubject} onChange={e=>setNoticeSubject(e.target.value)} placeholder="Notice Title..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '10px', background: theme.card, color: theme.text }} />
                    <textarea value={newNotice} onChange={e=>setNewNotice(e.target.value)} placeholder="Notice Content..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, height: '80px' }} />
                    <button onClick={handlePostNotice} style={{ width:'100%', padding:'12px', background:'#111', color:'#fff', borderRadius:'12px', border:'none', marginTop:'10px', fontWeight:'bold', cursor:'pointer' }}>Post Notice</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.card, padding: '40px', borderRadius: '40px', width: '450px' }} onClick={e => e.stopPropagation()}>
               <h2 style={{ color: theme.text, fontWeight: '900', marginBottom: '20px' }}>{editingEvent ? 'Update' : 'Schedule'} Event</h2>
               <input placeholder="Event Title" value={eventTitle} onChange={e=>setEventTitle(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: `1px solid ${theme.border}`, marginBottom: '15px', background: theme.bg, color: theme.text }} />
               <input type="datetime-local" value={eventDate} onChange={e=>setEventDate(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: `1px solid ${theme.border}`, marginBottom: '25px', background: theme.bg, color: theme.text }} />
               <div style={{ display:'flex', gap:'15px' }}>
                 <button onClick={handleSaveEvent} style={{ flex:1, padding:'15px', background:'#5b6cfd', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'900', cursor:'pointer' }}>Save</button>
                 <button onClick={() => setShowEventModal(false)} style={{ flex:1, padding:'15px', background:'#f5f5f5', color:'#333', border:'none', borderRadius:'15px', fontWeight:'900', cursor:'pointer' }}>Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STREAK MODAL */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)' }} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ background: '#fff', padding: '0', borderRadius: '40px', width: '380px', overflow:'hidden', textAlign:'center', boxShadow:'0 30px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                <div ref={badgeRef} style={{background:'#fff', padding:'40px 20px'}}>
                   <div style={{fontSize:'70px', marginBottom:'10px'}}>🔥</div>
                   <h2 style={{ fontSize: '38px', fontWeight: '950', color: '#1c252e', margin: 0 }}>{streak} Days</h2>
                   <p style={{ color: '#888', fontWeight: '700', marginTop: '5px' }}>STUDY STREAK</p>
                   <div style={{ width:'100%', height:'8px', background:'#f0f0f0', borderRadius:'10px', marginTop:'25px', overflow:'hidden' }}>
                      <motion.div initial={{width:0}} animate={{width: `${(Math.min(studySeconds, 600)/600)*100}%`}} style={{ height:'100%', background:'#5b6cfd' }} />
                   </div>
                   <p style={{ fontSize: '11px', color: '#aaa', marginTop: '10px' }}>{Math.floor(studySeconds/60)} / 10 Minutes daily goal</p>
                </div>
                <div style={{ padding:'20px', background:'#fcfdfe', borderTop:'1px solid #eee' }}>
                   <button onClick={handleDownloadBadge} style={{ width:'100%', padding:'16px', background:'#111', color:'#fff', border:'none', borderRadius:'18px', fontWeight:'900', cursor:'pointer' }}>Download Badge</button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}