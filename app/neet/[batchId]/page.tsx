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
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingNotif, setEditingNotif] = useState<any>(null)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Announcement/Notice Form States
  const [newNotice, setNewNotice] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null) // Local File support
  
  // Event Form States
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
      const { data: sData } = await supabase.from('student_stats').select('*').eq('email', session?.user?.email).single();
      if (sData) setUserProfile(sData);

      const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
      setNotices(nData || []);

      const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
      setEvents(eData || []);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  // --- STORAGE UPLOAD LOGIC ---
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `notices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('notices') // Ensure bucket 'notices' is Public in Supabase
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('notices').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- NOTIFICATION LOGIC (CREATE, EDIT, STORAGE) ---
  const handlePostNotice = async (textOverride?: any) => {
    const content = typeof textOverride === 'string' ? textOverride : newNotice;
    if (!content || !content.trim()) return;
    
    setUploading(true);
    try {
      let finalImageUrl = editingNotif?.image_url || "";

      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      if (editingNotif) {
        const { error } = await supabase
          .from('notices')
          .update({ 
            content: content.trim(), 
            image_url: finalImageUrl,
            title: "Update" 
          })
          .eq('id', editingNotif.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notices').insert([{ 
            batch_id: batchId, 
            title: typeof textOverride === 'string' ? "Event Alert" : "Announcement",
            content: content.trim(),
            image_url: finalImageUrl,
            category: typeof textOverride === 'string' ? "Event" : "General"
        }]);
        if (error) throw error;
      }

      setNewNotice("");
      setSelectedFile(null);
      setEditingNotif(null);
      fetchData(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const startEditNotif = (notif: any) => {
    setEditingNotif(notif);
    setNewNotice(notif.content);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  // --- EVENT LOGIC ---
  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate) return alert("Please fill both Title and Date");
    setUploading(true);
    try {
      const displayTime = new Date(eventDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({ title: eventTitle, event_time: eventDate })
          .eq('id', editingEvent.id);
        if (error) throw error;
        await handlePostNotice(`✏️ Event Updated: ${eventTitle} (${displayTime})`);
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{ batch_id: batchId, title: eventTitle, event_time: eventDate }]);
        if (error) throw error;
        await handlePostNotice(`🗓️ New Event Scheduled: ${eventTitle} at ${displayTime}`);
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      setEventTitle("");
      setEventDate("");
      fetchData(); 
    } catch (err: any) {
      alert("Event Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (ev: any) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    const date = new Date(ev.event_time);
    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventDate(formattedDate);
    setShowEventModal(true);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) fetchData();
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/neet" style={backBtnCircle}>←</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Study Hub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <motion.div whileTap={{ scale: 0.9 }} style={statPill} onClick={() => setShowNotifs(true)}>
              🔔 {notices.length}
            </motion.div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
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
                    <button onClick={() => signOut()} style={dropLogout}>Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main style={contentArea}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={batchBanner}>
          <small style={{ opacity: 0.7 }}>ACTIVE BATCH</small>
          <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '5px 0' }}>{batchId.toUpperCase()}</h2>
        </motion.div>

        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={offeringGrid}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -5, scale: 1.02 }} style={offeringItem}>
                  <span style={{ fontWeight: '700', color: '#333' }}>{item}</span>
                  <span style={{ color: '#6157ff', fontWeight: 'bold' }}>❯</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        <div style={dashboardGrid}>
          <div style={{ flex: 2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
              <h3 style={sectionTitle}>Upcoming Events</h3>
              {isOwner && <button onClick={() => { setEditingEvent(null); setEventTitle(""); setEventDate(""); setShowEventModal(true); }} style={addBtn}>+ Create</button>}
            </div>
            {events.length === 0 ? <div style={emptyBox}>🕒 No upcoming events scheduled.</div> : (
              events.map(ev => (
                <motion.div layout key={ev.id} style={dataRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{ev.title}</div>
                    <div style={{ fontSize: '12px', color: '#6157ff', fontWeight: '600' }}>
                        {new Date(ev.event_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  {isOwner && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal(ev)} style={editActionBtn}>Edit</button>
                      <button onClick={() => deleteEvent(ev.id)} style={deleteActionBtn}>Delete</button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
          
          <div style={statsSidebar}>
             <h3 style={sectionTitle}>Stats</h3>
             <div style={statRow}>
                <span>Total XP Earned</span>
                <b style={{color:'#6157ff', fontSize:'20px'}}>{userProfile?.xp_points || 0}</b>
             </div>
             <div style={statRow}>
                <span>Current Streak</span>
                <b style={{color:'#ff9800', fontSize:'20px'}}>🔥 0</b>
             </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type:'spring', damping:25 }} style={drawer} onClick={e => e.stopPropagation()}>
              <div style={drawerHeader}>
                <h3 style={{margin:0}}>Notifications</h3>
                <button onClick={() => { setShowNotifs(false); setEditingNotif(null); }} style={closeBtn}>✕</button>
              </div>
              {isOwner && (
                <div style={adminPanel}>
                  <textarea 
                    value={newNotice} 
                    onChange={e => setNewNotice(e.target.value)} 
                    placeholder="Message content..." 
                    style={notifInput} 
                  />
                  <label style={fileLabel}>
                    {selectedFile ? `📎 ${selectedFile.name}` : "📁 Add Image from Local"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <button onClick={() => handlePostNotice()} disabled={uploading} style={sendBtn}>
                      {uploading ? "Uploading..." : editingNotif ? "Update Notice" : "Post Notice"}
                    </button>
                    {editingNotif && (
                       <button onClick={() => {setEditingNotif(null); setNewNotice(""); setSelectedFile(null);}} style={cancelBtn}>Cancel</button>
                    )}
                  </div>
                </div>
              )}
              <div style={{padding:'10px', overflowY:'auto', flex: 1}}>
                {notices.map(n => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={n.id} style={notifCard}>
                    {n.image_url && <img src={n.image_url} alt="notice" style={notifImgDisplay} />}
                    <div style={{lineHeight: '1.5', fontWeight: '500', color: '#1c252e'}}>{n.content}</div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px', alignItems: 'center'}}>
                      <small style={{color:'#6157ff', fontWeight:'700'}}>
                        🕒 {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </small>
                      {isOwner && (
                        <div style={{display: 'flex', gap: '12px'}}>
                          <button onClick={() => startEditNotif(n)} style={editLinkBtn}>Edit</button>
                          <button onClick={() => deleteNotice(n.id)} style={delLinkBtn}>Delete</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay} onClick={() => setShowEventModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={modal} onClick={e => e.stopPropagation()}>
               <h3 style={{marginTop:0}}>{editingEvent ? 'Update Event' : 'Schedule Event'}</h3>
               <label style={{fontSize: '12px', fontWeight: 'bold', color: '#666'}}>Event Title</label>
               <input placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
               <label style={{fontSize: '12px', fontWeight: 'bold', color: '#666', marginTop: '15px', display: 'block'}}>Date & Time</label>
               <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
               <button onClick={handleSaveEvent} disabled={uploading} style={sendBtn}>
                 {uploading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'#fff', borderBottom:'1px solid #f0f0f0', zIndex: 1000, height: '65px' };
const headerInner: any = { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'100%', padding:'0 20px' };
const backBtnCircle: any = { textDecoration:'none', color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' };
const statPill: any = { background:'#f9fafc', padding:'8px 15px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', border:'1px solid #eee' };
const navAvatar: any = { width:'36px', height:'36px', borderRadius:'50%', border:'2px solid #6157ff', cursor:'pointer', objectFit: 'cover' };
const navName: any = { fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer' };
const contentArea: any = { paddingTop:'100px', maxWidth:'1100px', margin:'0 auto', padding:'20px' };
const batchBanner: any = { background:'#1c252e', color:'#fff', padding:'50px', borderRadius:'25px', marginBottom:'40px' };
const sectionTitle: any = { fontSize:'18px', fontWeight:'800', margin:'0 0 20px', color: '#333' };
const offeringGrid: any = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px' };
const offeringItem: any = { padding:'25px', background:'#fff', borderRadius:'20px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const dashboardGrid: any = { display:'flex', gap:'40px', marginTop: '20px' };
const statsSidebar: any = { flex:1, borderLeft:'1px solid #eee', paddingLeft:'30px' };
const statRow: any = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', fontSize:'14px', fontWeight:'600', color: '#666' };
const dataRow: any = { background:'#fff', padding:'20px', borderRadius:'18px', marginBottom:'12px', border:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const emptyBox: any = { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' };
const overlay: any = { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', zIndex:2000, display:'flex', justifyContent:'flex-end', alignItems: 'center' };
const drawer: any = { width:'420px', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' };
const drawerHeader: any = { padding:'25px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems: 'center' };
const adminPanel: any = { padding:'20px', background:'#f9fafc', borderBottom:'1px solid #eee' };
const notifInput: any = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #eee', resize:'none', fontSize:'14px' };
const fileLabel: any = { display: 'block', background: '#fff', border: '1px dashed #ccc', padding: '10px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', color: '#666', marginTop:'10px' };
const sendBtn: any = { width:'100%', padding:'15px', background:'#6157ff', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold', marginTop:'10px', cursor:'pointer' };
const cancelBtn: any = { padding:'10px 15px', background:'#eee', color:'#666', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', marginTop:'10px' };
const notifCard: any = { padding:'20px', borderBottom:'1px solid #f9f9f9', fontSize:'14px' };
const notifImgDisplay: any = { width: '100%', borderRadius: '12px', marginBottom: '12px', objectFit: 'cover', maxHeight: '250px', border: '1px solid #eee' };
const closeBtn: any = { background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#ccc' };
const editLinkBtn: any = { background:'none', border:'none', color:'#0070f3', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const delLinkBtn: any = { background:'none', border:'none', color:'#ff4d4d', fontSize:'12px', fontWeight:'bold', cursor:'pointer' };
const addBtn: any = { background:'#6157ff', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const modal: any = { background:'#fff', padding:'40px', borderRadius:'30px', width:'400px', margin:'auto' };
const modalInput: any = { width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid #eee', marginTop:'5px' };
const dropdownMenu: any = { position: 'absolute', top: '45px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0', width: '150px', overflow: 'hidden', zIndex: 100 };
const dropLogout: any = { padding: '12px 25px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%', textAlign: 'left' };
const editActionBtn: any = { background: '#f0f7ff', color: '#0070f3', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const deleteActionBtn: any = { background: '#fff1f1', color: '#ff4d4d', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };