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
  
  // Profile & Logic States
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isStreakAchieved, setIsStreakAchieved] = useState(false);

  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  // Owner Input States
  const [newNotice, setNewNotice] = useState("")
  const [noticeSubject, setNoticeSubject] = useState("Announcement")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [editingNotif, setEditingNotif] = useState<any>(null)

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
        if (s < 600) {
            const ns = s + 1;
            if (ns >= 600 && !isStreakAchieved) {
                setStreak(prev => prev + 1);
                setIsStreakAchieved(true);
                localStorage.setItem("userStreak", (streak + 1).toString());
            }
            return ns;
        }
        return s;
      });
    }, 1000);

    if (session?.user?.email) fetchData();
    return () => clearInterval(interval);
  }, [batchId, session, isStreakAchieved]);

  const fetchData = async () => {
    supabase.from('student_stats').select('*').eq('email', session?.user?.email).single().then(({data}) => setUserProfile(data));
    supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false }).then(({data}) => setNotices(data || []));
    supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true }).then(({data}) => setEvents(data || []));
  };

  const handlePostNotice = async () => {
    if (!newNotice.trim()) return;
    if (editingNotif) {
      await supabase.from('notices').update({ title: noticeSubject, content: newNotice.trim() }).eq('id', editingNotif.id);
    } else {
      await supabase.from('notices').insert([{ batch_id: batchId, title: noticeSubject, content: newNotice.trim() }]);
    }
    setNewNotice(""); setEditingNotif(null); fetchData();
  };

  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: '#ffffff' });
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
            <Link href="/" style={{ textDecoration: 'none' }}><motion.div whileTap={{ scale: 0.9 }} style={backBtnCircle}>←</motion.div></Link>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                {/* STREAK BUTTON RE-ENABLED */}
                <motion.div whileHover={{ scale: 1.05 }} style={streakPill} onClick={() => setShowStreakModal(true)}>🔥 {streak}</motion.div>
                <motion.div whileHover={{ scale: 1.1 }} style={bellContainer} onClick={() => setShowNotifs(true)}>
                    <span>🔔</span>{unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </motion.div>
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={dropdownMenu}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <div style={bannerDots} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <small style={{ opacity: 0.8, fontWeight: '700' }}>YOUR BATCH</small>
            <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>{batchId.toUpperCase()} MISSION...</h2>
            <div style={studyGoalText}>Study 10 mins for Streak: <b>{Math.floor(studySeconds/60)}/10m</b></div>
          </div>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <motion.div key={item} whileHover={{ y: -8, scale: 1.02 }} style={offeringItem}>
                <span style={{ fontWeight: '800', color: '#000', fontSize: '16px' }}>{item}</span>
                <div style={arrowCircle}>❯</div>
              </motion.div>
            ))}
          </div>
        </section>

        <div style={dashboardGrid}>
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => setShowEventModal(true)} style={addBtn}>+ Create Event</button>}
            </div>
            {events.map(ev => (
              <div key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#111' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#5b6cfd' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && <button onClick={() => supabase.from('events').delete().eq('id', ev.id).then(()=>fetchData())} style={textActionBtnRed}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={{fontSize:'20px', fontWeight:'800'}}>Notifications</div>
                 <button onClick={() => {setLastReadTime(Date.now()); localStorage.setItem(`last_read_${batchId}`, Date.now().toString())}} style={markReadBtnUI}>Mark All Read</button>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                {notices.map(n => (
                    <div key={n.id} style={notifCardUI}>
                      <div style={{flex: 1}}>
                         <div style={{fontWeight:'800', color:'#5b6cfd'}}>{n.title}</div>
                         <div style={{fontSize:'14px', color:'#333', marginTop:'4px'}}>{n.content}</div>
                         {isOwner && (
                             <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                <button onClick={() => {setEditingNotif(n); setNewNotice(n.content); setNoticeSubject(n.title)}} style={textActionBtn}>Edit</button>
                                <button onClick={() => supabase.from('notices').delete().eq('id', n.id).then(()=>fetchData())} style={textActionBtnRed}>Delete</button>
                             </div>
                         )}
                      </div>
                    </div>
                ))}
              </div>
              {isOwner && (
                <div style={adminPanelNotifUI}>
                   <select value={noticeSubject} onChange={(e)=>setNoticeSubject(e.target.value)} style={subjectSelectUI}>
                      <option value="Announcement">📢 Announcement</option>
                      <option value="New Class">🎥 New Class</option>
                      <option value="Test Update">📝 Test Update</option>
                      <option value="Homework">📚 Homework</option>
                   </select>
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Write update..." style={notifInputUI} />
                   <button onClick={handlePostNotice} style={notifSendBtn}>{editingNotif ? 'Update Notice' : 'Post Notice'}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STREAK MODAL (Stars only in gradient) */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={streakCardPremium} onClick={e => e.stopPropagation()}>
              <div ref={badgeRef} style={{background:'#fff', borderRadius:'35px', overflow:'hidden'}}>
                <motion.div 
                    animate={{ background: ['linear-gradient(135deg, #5b6cfd, #9c42f5)', 'linear-gradient(135deg, #9c42f5, #ff5b84)', 'linear-gradient(135deg, #5b6cfd, #9c42f5)'] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={streakCircleHeader}
                >
                    {[...Array(8)].map((_, i) => (
                        <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.3 }}
                          style={{ position: 'absolute', top: `${Math.random()*70}%`, left: `${Math.random()*90}%`, fontSize: '14px' }}>✨</motion.div>
                    ))}
                    <div style={streakMainVal}>{streak} <small style={{fontSize:'12px', display:'block', color:'#888'}}>DAYS</small></div>
                </motion.div>
                <div style={streakInfoBody}>
                    <h2 style={{margin:0, fontWeight:'900'}}>Study Streak!</h2>
                    <div style={progressBarBg}><motion.div animate={{width: `${(studySeconds/600)*100}%`}} style={progressBarFill} /></div>
                </div>
              </div>
              <div style={shareSectionUI}><button onClick={handleDownloadBadge} style={downloadBtnUI}>Download Badge</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- ALL REQUIRED STYLES ---
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

const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'30px', background:'#fff', borderRadius:'30px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer' };
const arrowCircle: any = { width: '32px', height: '32px', borderRadius: '50%', background: '#f5f7ff', color: '#5b6cfd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' };
const sectionTitle: any = { fontSize:'20px', fontWeight:'900', margin:'0 0 25px' };

const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter: 'blur(4px)' };
const streakCardPremium: any = { width:'400px', background:'#fff', borderRadius:'40px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 30px 60px rgba(0,0,0,0.3)' };
const streakCircleHeader: any = { height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', position:'relative' };
const streakMainVal: any = { width: '120px', height: '120px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '900', color: '#5b6cfd', zIndex: 2 };
const streakInfoBody: any = { padding: '30px 20px', background: '#fff' };
const progressBarBg: any = { width:'100%', height:'8px', background:'#f0f0f0', borderRadius:'10px', marginTop:'15px', overflow:'hidden' };
const progressBarFill: any = { height:'100%', background:'#5b6cfd' };
const downloadBtnUI: any = { width: '100%', padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' };

const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '15px' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2.5px solid #5b6cfd', objectFit: 'cover' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };

const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0', display:'flex', flexDirection:'column' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', display: 'block' };
const dropdownLogoutBtn: any = { width:'100%', textAlign:'left', padding: '12px 15px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderRadius: '12px', cursor: 'pointer' };

const drawerUI: any = { width:'460px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'absolute', right: 0 };
const drawerHeaderUI: any = { padding:'30px 25px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const notifCardUI: any = { padding: '20px', borderRadius: '25px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '12px', display:'flex' };
const adminPanelNotifUI: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const subjectSelectUI: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #eee', marginBottom:'10px', fontSize:'14px', outline:'none' };
const notifInputUI: any = { width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', fontSize: '14px', minHeight: '80px', outline:'none' };
const notifSendBtn: any = { width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', cursor:'pointer' };

const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const textActionBtn: any = { background:'none', border:'none', color:'#0070f3', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer', padding:0 };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'25px', borderRadius:'30px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const closeX: any = { position:'absolute', top:'20px', right:'20px', border:'none', background:'none', fontSize:'22px', cursor:'pointer', color:'#fff', zIndex: 10 };
const shareSectionUI: any = { padding: '20px 20px 30px', background: '#fcfdfe', borderTop: '1px solid #eee' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };