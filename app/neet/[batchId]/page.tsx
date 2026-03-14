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
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Admin Form States
  const [newNotice, setNewNotice] = useState("")
  const [noticeFile, setNoticeFile] = useState<File | null>(null)
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
    try {
      // 1. Fetch Profile Info (Internal DB priority)
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      // 2. Fetch Notifications
      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);

      // 3. Fetch Events
      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // --- ACTIONS ---
  const handlePostNotice = async (textOverride?: string) => {
    const textToSend = textOverride || newNotice;
    if (!textToSend && !noticeFile) return;
    setUploading(true);
    try {
      let imageUrl = "";
      if (noticeFile) {
        const path = `notices/${Date.now()}_${noticeFile.name}`;
        await supabase.storage.from('batch-materials').upload(path, noticeFile);
        imageUrl = supabase.storage.from('batch-materials').getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await supabase.from('notices').insert([{ batch_id: batchId, content: textToSend, image_url: imageUrl }]).select();
      if (!error && data) setNotices(prev => [data[0], ...prev]);
      setNewNotice(""); setNoticeFile(null);
    } catch (e) { alert("Error sending notice"); }
    setUploading(false);
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return;
    setUploading(true);
    const { data, error } = await supabase.from('events').insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]).select();
    if (!error && data) {
      await handlePostNotice(`🗓️ New Event: ${eventTitle} scheduled for ${new Date(eventDate).toLocaleString()}`);
      setEvents(prev => [...prev, data[0]].sort((a,b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()));
      setShowEventModal(false); setEventTitle(""); setEventDate("");
    }
    setUploading(false);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#f4f7f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SEPARATED HEADER */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study Hub</h1>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={statPill} onClick={() => setShowNotifs(true)}>
                🔔 {notices.length}
            </motion.div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.img 
                whileHover={{ rotate: 5 }}
                src={userProfile?.avatar_url || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
                style={navAvatar} 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              />
              <span style={navName} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                {userProfile?.student_name || session?.user?.name?.split(' ')[0]}
              </span>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={dropdownMenu}>
                    <Link href="/profile" style={dropItem}>My Profile</Link>
                    <button onClick={() => signOut()} style={dropLogout}>Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={contentArea}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={batchBanner}>
          <small style={{ opacity: 0.7, letterSpacing: '1px' }}>YOUR ACTIVE BATCH</small>
          <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '10px 0' }}>{batchId.toUpperCase()}</h2>
        </motion.div>

        <div style={dashboardGrid}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={glassCard}>
              <h3 style={cardTitle}>Batch Offerings</h3>
              <div style={offeringGrid}>
                {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item, i) => (
                  <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'}>
                    <motion.div whileHover={{ y: -5, background: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} style={offeringItem}>
                      {item} <span style={{ color: '#6157ff' }}>❯</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={glassCard}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px' }}>
                <h3 style={cardTitle}>Upcoming Events</h3>
                {isOwner && <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowEventModal(true)} style={createBtn}>+ Add Event</motion.button>}
              </div>
              {events.length === 0 ? <div style={emptyPlaceholder}>🕒 No events scheduled.</div> : (
                events.map(ev => (
                  <motion.div layout key={ev.id} style={dataRow}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                      <div style={{ fontSize: '12px', color: '#6157ff' }}>{new Date(ev.event_time).toLocaleString()}</div>
                    </div>
                    {isOwner && <button onClick={() => deleteEvent(ev.id)} style={trashIcon}>🗑️</button>}
                  </motion.div>
                ))
              )}
            </motion.section>
          </div>

          {/* RIGHT COLUMN */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} style={glassCard}>
             <h3 style={cardTitle}>Your Progress</h3>
             <div style={xpCircleBox}>
                <p style={{ margin: 0, color: '#888' }}>Total XP Earned</p>
                <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '48px', margin: '10px 0', color: '#6157ff' }}>
                    {userProfile?.xp_points || 0}
                </motion.h1>
             </div>
          </motion.div>
        </div>
      </main>

      {/* NOTIFICATIONS DRAWER */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                <h3 style={{ margin: 0 }}>Notifications</h3>
                <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
              </div>
              {isOwner && (
                <div style={adminPostArea}>
                  <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Share an update..." style={notifTextarea} />
                  <input type="file" onChange={e => setNoticeFile(e.target.files?.[0] || null)} style={{ marginTop: '10px', fontSize: '12px' }} />
                  <button onClick={() => handlePostNotice()} disabled={uploading} style={sendBtn}>
                    {uploading ? "Sending..." : "Post Announcement"}
                  </button>
                </div>
              )}
              <div style={notifListArea}>
                {notices.map(n => (
                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={n.id} style={notifCard}>
                    {n.image_url && <img src={n.image_url} style={notifImage} alt="update" />}
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{n.content}</p>
                    <div style={notifMeta}>
                      <small>{new Date(n.created_at).toLocaleDateString()}</small>
                      {isOwner && <button onClick={() => deleteNotice(n.id)} style={deleteLink}>Delete</button>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowEventModal(false)}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={modalStyle} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>Schedule New Event</h3>
                <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
                <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
                <button onClick={handleCreateEvent} style={sendBtn}>Create Event</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position: 'fixed', top: 0, left: 0, width: '100%', background: '#fff', borderBottom: '1px solid #eef0f2', zIndex: 1000, height: '75px' };
const headerInner: any = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 20px' };
const backBtnCircle: any = { textDecoration: 'none', color: '#333', background: '#f4f7f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const statPill: any = { background: '#f4f7f9', padding: '10px 18px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' };
const navAvatar: any = { width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', border: '2px solid #6157ff', objectFit: 'cover' };
const navName: any = { fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer' };
const contentArea: any = { paddingTop: '110px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '60px' };
const batchBanner: any = { background: '#1c252e', color: '#fff', padding: '50px', borderRadius: '32px', marginBottom: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' };
const dashboardGrid: any = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' };
const glassCard: any = { background: '#fff', padding: '30px', borderRadius: '30px', border: '1px solid #eef0f2', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' };
const cardTitle: any = { margin: 0, fontSize: '20px', fontWeight: '800', color: '#1c252e' };
const offeringGrid: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' };
const offeringItem: any = { padding: '25px', background: '#f9fafc', borderRadius: '20px', textDecoration: 'none', color: '#1c252e', fontWeight: '800', display: 'flex', justifyContent: 'space-between', border: '1px solid #f0f2f5' };
const dataRow: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f8f9fa' };
const emptyPlaceholder: any = { textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '14px' };
const createBtn: any = { background: '#6157ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const trashIcon: any = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' };
const overlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };
const drawer: any = { width: '450px', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)' };
const drawerHeader: any = { padding: '30px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtn: any = { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#ccc' };
const adminPostArea: any = { padding: '25px', background: '#f9fafc', borderBottom: '1px solid #f0f2f5' };
const notifTextarea: any = { width: '100%', padding: '15px', borderRadius: '18px', border: '1px solid #eef0f2', fontSize: '14px', resize: 'none' };
const sendBtn: any = { width: '100%', padding: '16px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' };
const notifListArea: any = { flex: 1, overflowY: 'auto', padding: '15px' };
const notifCard: any = { padding: '20px', borderBottom: '1px solid #f8f9fa', marginBottom: '10px' };
const notifImage: any = { width: '100%', borderRadius: '18px', marginBottom: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' };
const notifMeta: any = { display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'center' };
const deleteLink: any = { background: 'none', border: 'none', color: '#ff4d4d', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const dropdownMenu: any = { position: 'absolute', top: '55px', right: 0, background: '#fff', borderRadius: '18px', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', width: '180px', overflow: 'hidden', border: '1px solid #f0f2f5' };
const dropItem: any = { display: 'block', padding: '15px 20px', textDecoration: 'none', color: '#1c252e', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #f8f9fa' };
const dropLogout: any = { width: '100%', textAlign: 'left', padding: '15px 20px', color: '#ff4d4d', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' };
const xpCircleBox: any = { textAlign: 'center', padding: '50px 20px', background: '#6157ff08', borderRadius: '30px', marginTop: '25px', border: '2px dashed #6157ff20' };
const modalStyle: any = { background: '#fff', padding: '40px', borderRadius: '35px', width: '420px', boxShadow: '0 30px 70px rgba(0,0,0,0.2)' };
const modalInput: any = { width: '100%', padding: '16px', borderRadius: '15px', border: '1px solid #eef0f2', marginTop: '15px', fontSize: '14px' };