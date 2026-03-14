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
  
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingNotif, setEditingNotif] = useState<any>(null)

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
    const updateFromLocal = () => {
      setLocalName(localStorage.getItem("userFirstName") || "");
      setLocalPic(localStorage.getItem("userProfilePic") || "");
    };

    const savedReadTime = localStorage.getItem(`last_read_${batchId}`);
    if (savedReadTime) setLastReadTime(parseInt(savedReadTime));

    updateFromLocal();
    setMounted(true);
    if (session?.user?.email) {
        fetchData();
        syncStreak();
    }
    window.addEventListener('storage', updateFromLocal);
    return () => window.removeEventListener('storage', updateFromLocal);
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

  const syncStreak = async () => {
    const email = session?.user?.email;
    let { data } = await supabase.from('user_streaks').select('*').eq('email', email).single();
    if (data) setStreakData(data);
  };

  const finalDisplayName = localName || userProfile?.student_name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || "User";
  const finalDisplayPic = localPic || userProfile?.avatar_url || session?.user?.image || `https://ui-avatars.com/api/?name=${finalDisplayName}`;
  const unreadCount = notices.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

  const handleMarkAllRead = async () => {
    setIsMarkingRead(true);
    const now = Date.now();
    setTimeout(() => {
        setLastReadTime(now);
        localStorage.setItem(`last_read_${batchId}`, now.toString());
        setIsMarkingRead(false);
    }, 600);
  };

  const handleDownloadBadge = async () => {
    if (badgeRef.current) {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => { if (blob) saveAs(blob, `streak_${streakData.current_streak}_days.png`); });
    }
  };

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
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
                    🔥 {streakData.current_streak || 0}
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
        {/* BIG SQUARE BANNER - FIXED VISIBILITY & PIC 1 CURVES */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={batchBanner}>
          <div style={bannerDots} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <small style={{ opacity: 0.8, letterSpacing: '1px', fontWeight: '700' }}>YOUR BATCH</small>
            <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0', lineHeight: 1.1 }}>
                {batchId.toUpperCase()} MISSION...
            </h2>
          </div>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 24px rgba(91, 108, 253, 0.12)' }} whileTap={{ scale: 0.98 }} style={offeringItem}>
                  <span style={{ fontWeight: '800', color: '#000', fontSize: '16px' }}>{item}</span>
                  <div style={arrowCircle}>❯</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        <div style={dashboardGrid}>
          <div style={{ flex: 1 }}>
            <h3 style={sectionTitle}>Upcoming Events</h3>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events.</div> : events.map(ev => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={ev.id} style={dataRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#111' }}>{ev.title}</div>
                  <div style={{ fontSize: '13px', color: '#5b6cfd', fontWeight: '600' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Rest of modals (Streak/Notifs) remain here */}
    </div>
  )
}

// --- UPDATED STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '80px' };
const headerInner: any = { maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 25px' };

const contentArea: any = { 
    paddingTop:'130px', // INCREASED GAP HERE so banner isn't hidden
    maxWidth:'1200px', 
    margin:'0 auto', 
    paddingLeft:'25px', 
    paddingRight:'25px', 
    paddingBottom: '50px' 
};

const batchBanner: any = { 
    background:'#1c252e', 
    color:'#fff', 
    padding:'80px 60px', // Large square-like feel
    borderRadius:'30px 30px 100px 30px', // Matching Pic 1 bottom curve
    marginBottom:'50px', 
    position: 'relative', 
    overflow: 'hidden', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
};

const bannerDots: any = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
    backgroundSize: '24px 24px'
};

const offeringItem: any = { 
    padding:'30px', 
    background:'#fff', 
    borderRadius:'30px', // Curved corners like Pic 1
    border:'1px solid #f0f0f0', 
    display:'flex', 
    justifyContent:'space-between', 
    alignItems:'center', 
    cursor: 'pointer' 
};

const arrowCircle: any = { 
    width: '32px', height: '32px', borderRadius: '50%', background: '#f5f7ff', color: '#5b6cfd', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' 
};

const sectionTitle: any = { fontSize:'22px', fontWeight:'900', margin:'0 0 25px', color: '#111' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'25px', borderRadius:'30px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };

const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };
const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '15px' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2.5px solid #5b6cfd', objectFit: 'cover' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd', lineHeight: '1.2' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '0.6px' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };

const statPillGroup: any = { display: 'flex', gap: '12px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '14px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' };

const dropdownMenu: any = { position: 'absolute', top: '65px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0' };
const dropdownItem: any = { padding: '12px 15px', color: '#333', fontSize: '14px', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', display: 'block' };
const dropdownLogoutBtn: any = { width: '100%', padding: '12px 15px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderRadius: '12px', textAlign: 'left', cursor: 'pointer' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };