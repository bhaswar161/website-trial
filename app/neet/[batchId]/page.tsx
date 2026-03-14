"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // UI & Data States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Admin Form States
  const [newNotice, setNewNotice] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [uploading, setUploading] = useState(false)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
    if (sData) setUserProfile(sData);

    // Fetch Notices
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    setNotices(nData || []);

    // Fetch Events
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    setEvents(eData || []);
  };

  // --- REPAIRED NOTIFICATION SEND LOGIC ---
  const handlePostNotice = async () => {
    if (!newNotice.trim()) return;
    setUploading(true);
    
    // 1. Insert and immediately SELECT the new row
    const { data, error } = await supabase
      .from('notices')
      .insert([{ batch_id: batchId, content: newNotice }])
      .select(); // Critical for real-time visibility

    if (error) {
      alert("Error sending: " + error.message);
    } else if (data) {
      // 2. Update local state immediately so user sees it
      setNotices(prev => [data[0], ...prev]);
      setNewNotice("");
    }
    setUploading(false);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER (Clean & Separated) */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtn}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={statPill} onClick={() => setShowNotifs(true)}>🔔 {notices.length}</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
                style={avatarStyle} 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              />
              <span style={{fontWeight:'700', fontSize:'14px'}}>{userProfile?.student_name || session?.user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE BODY */}
      <main style={contentArea}>
        <div style={batchBanner}>
          <small style={{ opacity: 0.7 }}>YOUR BATCH</small>
          <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <div style={offeringItem}>
                  <span style={{ fontWeight: '700', color: '#333' }}>{item}</span>
                  <span style={{ color: '#6157ff' }}>❯</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div style={integratedLayout}>
          <div style={{ flex: 2 }}>
            <h3 style={sectionTitle}>Upcoming Events</h3>
            {events.length === 0 ? <div style={{padding:'20px 0', color:'#aaa'}}>No events scheduled.</div> : (
              events.map(ev => (
                <div key={ev.id} style={eventRow}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                    <div style={{ fontSize: '12px', color: '#6157ff' }}>{new Date(ev.event_time).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={statSidebar}>
             <h3 style={sectionTitle}>Stats</h3>
             <div style={statItem}><span>XP</span> <b style={{color:'#6157ff'}}>{userProfile?.xp_points || 0}</b></div>
             <div style={statItem}><span>Streak</span> <b style={{color:'#ff9800'}}>🔥 0</b></div>
          </div>
        </div>
      </main>

      {/* NOTIFICATIONS DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type:'spring', damping:25 }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHead}>
                <h3 style={{margin:0}}>Notifications</h3>
                <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
              </div>

              {isOwner && (
                <div style={adminPanel}>
                  <textarea 
                    value={newNotice} 
                    onChange={e => setNewNotice(e.target.value)} 
                    placeholder="Send a new update..." 
                    style={notifInput}
                  />
                  <button onClick={handlePostNotice} disabled={uploading} style={sendBtn}>
                    {uploading ? "Sending..." : "Post Announcement"}
                  </button>
                </div>
              )}

              <div style={notifList}>
                {notices.map(n => (
                  <div key={n.id} style={notifCard}>
                    <div style={{fontSize:'14px', lineHeight:'1.5'}}>{n.content}</div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px'}}>
                      <small style={{color:'#bbb'}}>{new Date(n.created_at).toLocaleDateString()}</small>
                      {isOwner && <button onClick={() => deleteNotice(n.id)} style={delBtn}>Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex:1000, height:'65px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtn: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPill: any = { background:'#f9fafc', padding:'8px 15px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', border:'1px solid #eee' };
const avatarStyle: any = { width:'36px', height:'36px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer' };
const contentArea: any = { paddingTop:'90px', maxWidth:'1000px', margin:'0 auto', padding:'100px 20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'40px', borderRadius:'20px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'20px', background:'#fff', borderRadius:'15px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const integratedLayout: any = { display:'flex', gap:'40px', marginTop:'20px' };
const statSidebar: any = { flex:1, borderLeft:'1px solid #f0f0f0', paddingLeft:'30px' };
const statItem: any = { display:'flex', justifyContent:'space-between', marginBottom:'15px', fontSize:'15px', fontWeight:'600' };
const overlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:2000, display:'flex', justifyContent:'flex-end' };
const drawer: any = { width:'400px', height:'100%', background:'#fff', display:'flex', flexDirection:'column' };
const drawerHead: any = { padding:'25px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between' };
const adminPanel: any = { padding:'20px', background:'#f9fafc', borderBottom:'1px solid #eee' };
const notifInput: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #ddd', resize:'none', fontSize:'14px' };
const sendBtn: any = { width:'100%', padding:'12px', background:'#6157ff', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold', marginTop:'10px', cursor:'pointer' };
const notifList: any = { flex:1, overflowY:'auto', padding:'10px' };
const notifCard: any = { padding:'20px', borderBottom:'1px solid #f9f9f9' };
const closeBtn: any = { background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#ccc' };
const delBtn: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const eventRow: any = { padding:'15px 0', borderBottom:'1px solid #f5f5f5' };