"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect, useMemo, useRef, use } from 'react' 
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
  
  // Profile Sync
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
    const syncData = () => {
      setLocalName(localStorage.getItem("userFirstName") || "");
      setLocalPic(localStorage.getItem("userProfilePic") || "");
      
      const savedStreak = parseInt(localStorage.getItem("userStreak") || "0");
      const lastDate = localStorage.getItem("lastStudyDate");
      const today = new Date().toDateString();

      if (lastDate && lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate !== yesterday.toDateString()) {
          setStreak(0);
          localStorage.setItem("userStreak", "0");
        } else { setStreak(savedStreak); }
      } else { setStreak(savedStreak); }
    };
    
    syncData();
    const interval = setInterval(() => {
      setStudySeconds(s => {
        if (s >= 600 && !isStreakAchieved) { // 10 minutes
            handleStreakSuccess();
            return s + 1;
        }
        return s + 1;
      });
    }, 1000);

    if (session?.user?.email) fetchData();
    return () => clearInterval(interval);
  }, [session, isStreakAchieved]);

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

  const handleStreakSuccess = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    setIsStreakAchieved(true);
    localStorage.setItem("userStreak", newStreak.toString());
    localStorage.setItem("lastStudyDate", new Date().toDateString());
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
      
      {/* HEADER */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={backBtnCircle}>←</motion.div>
            </Link>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                <motion.div whileHover={{ scale: 1.05 }} style={streakPill} onClick={() => setShowStreakModal(true)}>🔥 {streak}</motion.div>
                <motion.div whileHover={{ scale: 1.1 }} style={bellContainer} onClick={() => setShowNotifs(true)}>
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
        {/* BIG SQUARE BANNER - FIXED SPACING */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <div style={bannerDots} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <small style={{ opacity: 0.8, letterSpacing: '1px', fontWeight: '700' }}>YOUR BATCH</small>
            <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>{batchId.toUpperCase()} MISSION...</h2>
            <div style={studyProgressBox}>
                Time Studied: <b>{Math.floor(studySeconds/60)} / 10 mins</b>
            </div>
          </div>
        </motion.div>

        <section>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <motion.div key={item} whileHover={{ y: -8, scale: 1.02 }} style={offeringItem}>
                <span style={{ fontWeight: '800', color: '#000', fontSize: '18px' }}>{item}</span>
                <span style={{ color: '#5b6cfd', fontWeight: 'bold' }}>❯</span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* ANIMATED STREAK MODAL */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowStreakModal(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={streakCardPremium} onClick={e => e.stopPropagation()}>
              <button style={closeX} onClick={() => setShowStreakModal(false)}>✕</button>
              
              {/* Floating Star Objects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -30, 0], 
                    x: [0, 10, 0], 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8] 
                  }}
                  transition={{ duration: 3 + i, repeat: Infinity }}
                  style={{ position: 'absolute', top: `${15 + i*12}%`, left: `${10 + i*15}%`, fontSize: '20px' }}
                >⭐</motion.div>
              ))}

              <div ref={badgeRef} style={{position:'relative', zIndex: 5}}>
                <motion.div 
                    animate={{ background: ['linear-gradient(135deg, #5b6cfd, #9c42f5)', 'linear-gradient(135deg, #9c42f5, #5b6cfd)'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={streakCircleHeader}
                >
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={streakMainVal}>
                        {streak} <small style={{fontSize:'14px', display:'block'}}>DAYS</small>
                    </motion.div>
                </motion.div>
                <div style={streakInfoBody}>
                    <h2 style={{fontWeight:'900', color:'#111'}}>Stay Focused!</h2>
                    <p style={{color:'#666', fontSize:'14px'}}>Spend 10 mins daily to keep your flame alive.</p>
                    <div style={progressBar}><motion.div initial={{width:0}} animate={{width:`${(studySeconds/600)*100}%`}} style={progressFill} /></div>
                </div>
              </div>
              <div style={badgeDownloadSection}>
                <motion.button whileHover={{ scale: 1.05 }} onClick={handleDownloadBadge} style={downloadBtnUI}>Download Badge</motion.button>
              </div>
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
const contentArea: any = { paddingTop:'160px', maxWidth:'1200px', margin:'0 auto', paddingBottom:'60px' };

const batchBanner: any = { 
    background:'#1c252e', color:'#fff', padding:'80px 60px', 
    borderRadius:'30px 30px 100px 30px', marginBottom:'50px', 
    position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
};

const bannerDots: any = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' };
const studyProgressBox: any = { marginTop: '20px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px', display: 'inline-block', fontSize: '14px' };

const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'35px', background:'#fff', borderRadius:'30px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer' };
const sectionTitle: any = { fontSize:'22px', fontWeight:'900', margin:'0 0 25px', color: '#111' };

const statPillGroup: any = { display: 'flex', gap: '12px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '12px', borderRadius: '14px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };

const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '15px' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2.5px solid #5b6cfd', objectFit: 'cover' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd', lineHeight: '1.2' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '0.6px' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };

const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', display: 'block' };
const dropdownLogoutBtn: any = { width: '100%', padding: '12px 15px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderRadius: '12px', textAlign: 'left', cursor: 'pointer' };

const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter: 'blur(4px)' };
const streakCardPremium: any = { width:'400px', background:'#fff', borderRadius:'40px', overflow:'hidden', position:'relative', textAlign:'center', boxShadow:'0 30px 60px rgba(91, 108, 253, 0.3)' };
const streakCircleHeader: any = { height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const streakMainVal: any = { width: '120px', height: '120px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '900', color: '#5b6cfd' };
const streakInfoBody: any = { padding: '30px 20px', background: '#fff' };
const progressBar: any = { width: '100%', height: '8px', background: '#eee', borderRadius: '10px', marginTop: '20px', overflow: 'hidden' };
const progressFill: any = { height: '100%', background: '#5b6cfd' };
const badgeDownloadSection: any = { padding: '20px', background: '#f8fafc', borderTop: '1px solid #eee' };
const downloadBtnUI: any = { width: '100%', padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' };
const closeX: any = { position:'absolute', top:'20px', right:'20px', border:'none', background:'none', fontSize:'22px', cursor:'pointer', color:'#fff', zIndex: 10 };