"use client";
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useMemo, useRef, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [localName, setLocalName] = useState("");
  const [localPic, setLocalPic] = useState("");
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isStreakAchieved, setIsStreakAchieved] = useState(false);

  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [lastReadTime, setLastReadTime] = useState<number>(0)
  
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

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
      const saved = localStorage.getItem(`last_read_${batchId}`);
      if (saved) setLastReadTime(parseInt(saved));
    };
    syncProfile();

    const interval = setInterval(() => {
      setStudySeconds(s => {
        if (s < 600) {
            const ns = s + 1;
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

  // --- REFINED EVENT ACTIONS WITH AUTO-NOTIFY ---
  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) {
        alert("Please provide both Title and Date.");
        return;
    }
    
    try {
        const evPayload = { batch_id: batchId, title: eventTitle, event_time: eventDate, is_done: false };
        
        if (editingEvent) {
          await supabase.from('events').update(evPayload).eq('id', editingEvent.id);
          // Auto-Post Update Notice
          await supabase.from('notices').insert([{ 
              batch_id: batchId, 
              title: "🔄 Event Updated", 
              content: `"${eventTitle}" has been rescheduled for ${new Date(eventDate).toLocaleString()}` 
          }]);
        } else {
          await supabase.from('events').insert([evPayload]);
          // Auto-Post New Event Notice
          await supabase.from('notices').insert([{ 
              batch_id: batchId, 
              title: "📅 New Event Added", 
              content: `${eventTitle} is scheduled for ${new Date(eventDate).toLocaleString()}` 
          }]);
        }

        setShowEventModal(false);
        setEventTitle("");
        setEventDate("");
        setEditingEvent(null);
        fetchData();
    } catch (err: any) {
        alert("Error saving event: " + err.message);
    }
  };

  const handleEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(new Date(ev.event_time).toISOString().slice(0, 16));
    setShowEventModal(true);
  };

  const handleDoneDismiss = async (ev: any) => {
    await supabase.from('events').update({ is_done: true }).eq('id', ev.id);
    // Auto-Post Completion Notice
    await supabase.from('notices').insert([{ 
        batch_id: batchId, 
        title: "✅ Mission Accomplished", 
        content: `The task "${ev.title}" has been completed.` 
    }]);
    fetchData();
  };

  const handleDeleteEvent = async (ev: any) => {
    if(confirm("Delete this event?")) {
        await supabase.from('events').delete().eq('id', ev.id);
        // Auto-Post Deletion Notice
        await supabase.from('notices').insert([{ 
            batch_id: batchId, 
            title: "🚫 Event Cancelled", 
            content: `The event "${ev.title}" has been removed from the schedule.` 
        }]);
        fetchData();
    }
  };

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
            <Link href="/" style={{ textDecoration: 'none' }}><motion.div whileHover={{x:-3}} style={backBtnCircle}>←</motion.div></Link>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPillGroup}>
                <motion.div whileHover={{ scale: 1.05 }} style={streakPill} onClick={() => setShowStreakModal(true)}>🔥 {streak}</motion.div>
                <motion.div whileHover={{ rotate: [0,-10,10,0] }} style={bellContainer} onClick={() => setShowNotifs(true)}>
                    <span>🔔</span>{unreadCount > 0 && <span style={bellBadge}>{unreadCount}</span>}
                </motion.div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <motion.img animate={{ boxShadow: ['0 0 0px #5b6cfd', '0 0 10px #5b6cfd', '0 0 0px #5b6cfd'] }} transition={{ repeat: Infinity, duration: 3 }} src={finalDisplayPic} style={navAvatar} />
                <div style={nameWrapper}>
                  <span style={navNameText}>Hi, {finalDisplayName}</span>
                  <span style={navRoleText}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
                </div>
              </div>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={dropdownMenu}>
                    <Link href="/profile" style={dropdownItem}>👤 My Profile</Link>
                    <hr style={{ border: '0', borderTop: '1px solid #f0f0f0', margin: '5px 0' }} />
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
          <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0, position: 'relative' }}>{batchId.toUpperCase()} MISSION</h2>
        </motion.div>

        {/* OFFERINGS */}
        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item, idx) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                   whileHover={{ y: -8, scale: 1.02, boxShadow: '0 15px 30px rgba(91, 108, 253, 0.1)' }} style={offeringItem}>
                  <span style={{ fontWeight: '800', color: '#000', fontSize: '16px' }}>{item}</span>
                  <div style={arrowCircle}>❯</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* EVENTS SECTION */}
        <div style={dashboardGrid}>
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '25px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <motion.button whileHover={{ scale: 1.05 }} onClick={() => {setEditingEvent(null); setEventTitle(""); setEventDate(""); setShowEventModal(true)}} style={addBtn}>+ Create Event</motion.button>}
            </div>
            
            <AnimatePresence>
                {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events scheduled.</div> : events.map(ev => (
                <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={ev.id} style={dataRow}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', color: '#1c252e', fontSize: '16px' }}>{ev.title}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                            📅 {new Date(ev.event_time).toLocaleString()}
                        </div>
                    </div>
                    {isOwner && (
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={() => handleEditEvent(ev)} style={{...textActionBtn, background: '#f8faff', padding: '8px 15px', borderRadius: '10px'}}>Edit</button>
                        <motion.button whileTap={{scale:0.9}} onClick={() => handleDoneDismiss(ev)} style={{...textActionBtn, color:'#22c55e', background: '#f0fdf4', padding: '8px 15px', borderRadius: '10px'}}>✓ Done</motion.button>
                        <button onClick={() => handleDeleteEvent(ev)} style={{...textActionBtnRed, background: '#fef2f2', padding: '8px 15px', borderRadius: '10px'}}>Delete</button>
                    </div>
                    )}
                </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={modal} onClick={e => e.stopPropagation()}>
               <h2 style={{margin: '0 0 10px', fontWeight: '900'}}>{editingEvent ? 'Update Event' : 'Schedule Event'}</h2>
               <p style={{color: '#666', fontSize: '14px', marginBottom: '25px'}}>Students will be notified of changes.</p>
               
               <div style={{marginBottom: '20px'}}>
                  <label style={inputLabel}>Event Title</label>
                  <input placeholder="Ex: Physics Mock Test" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               </div>

               <div style={{marginBottom: '30px'}}>
                  <label style={inputLabel}>Date & Time</label>
                  <div style={customDateWrapper} onClick={() => dateInputRef.current?.showPicker()}>
                    <input ref={dateInputRef} type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={hiddenDateInput} />
                    <div style={dateDisplayFake}>
                       {eventDate ? new Date(eventDate).toLocaleString() : 'Select Date and Time'}
                       <span style={{fontSize: '18px'}}>📅</span>
                    </div>
                  </div>
               </div>

               <div style={{display: 'flex', gap: '12px'}}>
                  <motion.button whileTap={{scale: 0.95}} onClick={handleSaveEvent} style={notifSendBtn}>{editingEvent ? 'Update' : 'Create'} Event</motion.button>
                  <motion.button whileTap={{scale: 0.95}} onClick={() => setShowEventModal(false)} style={{...notifSendBtn, background: '#f5f5f5', color: '#333'}}>Cancel</motion.button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={modalOverlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={drawerUI} onClick={e => e.stopPropagation()}>
              <div style={drawerHeaderUI}>
                 <div style={{fontSize:'22px', fontWeight:'900'}}>Notifications</div>
                 <div style={{display:'flex', gap:'10px'}}>
                    <motion.button whileTap={{scale:0.95}} onClick={() => {setLastReadTime(Date.now()); localStorage.setItem(`last_read_${batchId}`, Date.now().toString())}} style={markReadBtnUI}>Mark All Read</motion.button>
                    <button onClick={() => setShowNotifs(false)} style={{...markReadBtnUI, background:'#eee', color:'#333'}}>Close</button>
                 </div>
              </div>
              <div style={{padding: '0 20px', flex: 1, overflowY: 'auto'}}>
                {notices.map(n => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={n.id} style={notifCardUI}>
                      <div style={{flex: 1}}>
                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:'800', color:'#5b6cfd'}}>{n.title}</div>
                            <div style={{fontSize:'10px', color:'#aaa'}}>{new Date(n.created_at).toLocaleString()}</div>
                         </div>
                         <div style={{fontSize:'14px', marginTop:'4px'}}>{n.content}</div>
                         {isOwner && (
                             <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                <button onClick={() => {setEditingNotif(n); setNoticeSubject(n.title); setNewNotice(n.content)}} style={textActionBtn}>Edit</button>
                                <button onClick={() => supabase.from('notices').delete().eq('id', n.id).then(()=>fetchData())} style={textActionBtnRed}>Delete</button>
                             </div>
                         )}
                      </div>
                    </motion.div>
                ))}
              </div>
              {isOwner && (
                <div style={adminPanelNotifUI}>
                   <input value={noticeSubject} onChange={(e)=>setNoticeSubject(e.target.value)} placeholder="Subject..." style={subjectInputUI} />
                   <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Write message..." style={notifInputUI} />
                   <button onClick={handlePostNotice} style={notifSendBtn}>{editingNotif ? 'Update Notice' : 'Post Notice'}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STYLE DEFINITIONS ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '80px', boxShadow:'0 2px 15px rgba(0,0,0,0.03)' };
const headerInner: any = { maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 25px' };
const contentArea: any = { paddingTop:'180px', maxWidth:'1200px', margin:'0 auto', paddingBottom:'60px', paddingLeft:'20px', paddingRight:'20px' };
const statPillGroup: any = { display: 'flex', gap: '12px', alignItems: 'center' };
const streakPill: any = { background: '#fff5f5', border: '1px solid #ffdcdc', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const bellContainer: any = { position: 'relative', background: '#f8f9ff', padding: '10px', borderRadius: '14px', cursor: 'pointer', border: '1px solid #eee' };
const bellBadge: any = { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px' };
const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' };
const navAvatar: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2.5px solid #5b6cfd', objectFit: 'cover' };
const nameWrapper: any = { display: 'flex', flexDirection: 'column' };
const navNameText: any = { fontSize: '15px', fontWeight: '800', color: '#5b6cfd' };
const navRoleText: any = { fontSize: '10px', fontWeight: '700', color: '#888' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'80px 60px', borderRadius:'30px 30px 100px 30px', marginBottom:'50px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' };
const bannerDots: any = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'20px' };
const offeringItem: any = { padding:'30px', background:'#fff', borderRadius:'30px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' };
const arrowCircle: any = { width: '32px', height: '32px', borderRadius: '50%', background: '#f5f7ff', color: '#5b6cfd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' };
const sectionTitle: any = { fontSize:'22px', fontWeight:'900', margin:'0 0 25px' };
const dashboardGrid: any = { display:'flex', gap:'40px' };
const dataRow: any = { background:'#fff', padding:'25px', borderRadius:'30px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const textActionBtn: any = { background:'none', border:'none', color:'#5b6cfd', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const textActionBtnRed: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', boxShadow: '0 4px 15px rgba(97, 87, 255, 0.2)' };
const modalOverlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter: 'blur(4px)' };
const drawerUI: any = { width:'460px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'absolute', right: 0 };
const drawerHeaderUI: any = { padding:'30px 25px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const markReadBtnUI: any = { background: '#f0f3ff', border: '1px solid #e0e7ff', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#5b6cfd', cursor: 'pointer' };
const notifCardUI: any = { padding: '20px', borderRadius: '25px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '12px' };
const adminPanelNotifUI: any = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfdfe' };
const subjectInputUI: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #eee', marginBottom:'10px', fontSize:'14px' };
const notifInputUI: any = { width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', fontSize: '14px', minHeight: '80px' };
const notifSendBtn: any = { flex: 1, padding: '15px', background: '#111', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', cursor:'pointer' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'40px', width:'450px', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' };
const inputLabel: any = { display: 'block', fontSize: '13px', fontWeight: '800', color: '#888', marginBottom: '8px', marginLeft: '5px' };
const modalInput: any = { width:'100%', padding:'16px', borderRadius:'18px', border:'1.5px solid #eee', fontSize:'15px', outline:'none' };
const customDateWrapper: any = { position: 'relative', width: '100%', cursor: 'pointer' };
const hiddenDateInput: any = { position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' };
const dateDisplayFake: any = { padding: '16px', borderRadius: '18px', border: '1.5px solid #eee', background: '#f9f9fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333', fontSize: '15px' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const dropdownMenu: any = { position: 'absolute', top: '75px', right: '0', background: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', borderRadius: '20px', padding: '10px', zIndex: 100, minWidth: '180px', border: '1px solid #f0f0f0' };
const dropdownItem: any = { display:'block', padding:'12px 15px', textDecoration:'none', color:'#333', fontWeight: '700', fontSize: '14px' };
const dropdownLogoutBtn: any = { width:'100%', textAlign:'left', padding:'12px 15px', background:'none', border:'none', color:'#ef4444', fontWeight: '800', cursor:'pointer' };