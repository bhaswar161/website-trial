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
  
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  
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

    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    setNotices(nData || []);

    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    setEvents(eData || []);
  };

  const handlePostNotice = async () => {
    if (!newNotice.trim()) return;
    setUploading(true);
    // Explicitly using 'batch_id' to match the SQL above
    const { data, error } = await supabase.from('notices').insert([{ 
        batch_id: batchId, 
        content: newNotice 
    }]).select();

    if (error) {
      console.error("Insert Error:", error);
      alert("Error: " + error.message);
    } else if (data) {
      setNotices(prev => [data[0], ...prev]);
      setNewNotice("");
    }
    setUploading(false);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this?")) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return;
    const { data, error } = await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]).select();
    if (!error && data) {
      setEvents(prev => [...prev, data[0]].sort((a,b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()));
      setShowEventModal(false);
      setEventTitle("");
    }
  };

  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: '#f4f7f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={statPill} onClick={() => setShowNotifs(true)}>🔔 {notices.length}</div>
            <img 
              src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
              style={navAvatar} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main style={contentArea}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <small style={{ opacity: 0.6 }}>ACTIVE BATCH</small>
          <h2 style={{ fontSize: '28px', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </motion.div>

        <section style={{ marginBottom: '30px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -5 }} style={offeringItem}>
                  <span style={{ fontWeight: '700', color: '#333' }}>{item}</span>
                  <span style={{ color: '#6157ff' }}>❯</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => setShowEventModal(true)} style={addBtn}>+ Create</button>}
            </div>
            {events.map(ev => (
              <div key={ev.id} style={dataRow}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#6157ff' }}>{new Date(ev.event_time).toLocaleString()}</div>
                </div>
                {isOwner && <button onClick={() => {supabase.from('events').delete().eq('id', ev.id); fetchData()}} style={{border:'none', background:'none'}}>🗑️</button>}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#fff', padding: '25px', borderRadius: '20px', height: 'fit-content' }}>
             <h3 style={sectionTitle}>Stats</h3>
             <div style={{fontSize:'14px', marginBottom:'10px'}}>Total XP: <b style={{color:'#6157ff'}}>{userProfile?.xp_points || 0}</b></div>
             <div style={{fontSize:'14px'}}>Streak: <b style={{color:'#ff9800'}}>🔥 0 Days</b></div>
          </div>
        </div>
      </main>

      {/* DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type:'spring', damping:25 }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                <h3 style={{margin:0}}>Notifications</h3>
                <button onClick={() => setShowNotifs(false)} style={{background:'none', border:'none', fontSize:'20px'}}>✕</button>
              </div>
              {isOwner && (
                <div style={{padding:'20px', background:'#f9fafc'}}>
                  <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Type update..." style={notifInput} />
                  <button onClick={handlePostNotice} disabled={uploading} style={sendBtn}>{uploading ? "Sending..." : "Post Announcement"}</button>
                </div>
              )}
              <div style={{padding:'10px', overflowY:'auto'}}>
                {notices.map(n => (
                  <div key={n.id} style={notifCard}>
                    <div>{n.content}</div>
                    {isOwner && <button onClick={() => deleteNotice(n.id)} style={{color:'red', border:'none', background:'none', fontSize:'11px', cursor:'pointer', marginTop:'10px'}}>Delete</button>}
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

// STYLES
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #eee', zIndex:1000, height:'65px' };
const headerInner: any = { maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPill: any = { background:'#f9fafc', padding:'8px 15px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', border:'1px solid #eee' };
const navAvatar: any = { width:'36px', height:'36px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer' };
const contentArea: any = { paddingTop:'90px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'40px', borderRadius:'24px', marginBottom:'30px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 15px' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'20px', background:'#fff', borderRadius:'15px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' };
const dataRow: any = { background:'#fff', padding:'15px', borderRadius:'15px', marginBottom:'10px', border:'1px solid #eee', display:'flex', justifyContent:'space-between' };
const overlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:2000, display:'flex', justifyContent:'flex-end' };
const drawer: any = { width:'400px', height:'100%', background:'#fff', display:'flex', flexDirection:'column' };
const drawerHeader: any = { padding:'25px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between' };
const notifInput: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #ddd', resize:'none', fontSize:'14px' };
const sendBtn: any = { width:'100%', padding:'12px', background:'#6157ff', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold', marginTop:'10px', cursor:'pointer' };
const notifCard: any = { padding:'20px', borderBottom:'1px solid #f9f9f9', fontSize:'14px' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' };