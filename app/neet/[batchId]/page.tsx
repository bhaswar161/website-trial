"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

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
  const [userProfile, setUserProfile] = useState<{avatar_url?: string, xp_points?: number, student_name?: string} | null>(null)
  
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
    // 1. Fetch Profile Info (Prioritize your DB over Google)
    const { data: sData } = await supabase.from('student_stats').select('avatar_url, xp_points, student_name').eq('email', session?.user?.email).single();
    if (sData) setUserProfile(sData);

    // 2. Fetch Notifications
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    if (nData) setNotices(nData || []);

    // 3. Fetch Events
    const { data: eData } = await supabase.from('events').select('*').eq('batch_id', batchId).order('event_time', { ascending: true });
    if (eData) setEvents(eData || []);
  };

  const handlePostNotice = async (contentOverride?: string) => {
    const content = contentOverride || newNotice;
    if (!content && !noticeFile) return;
    setUploading(true);
    let imageUrl = "";

    if (noticeFile) {
      const path = `notices/${Date.now()}_${noticeFile.name}`;
      await supabase.storage.from('batch-materials').upload(path, noticeFile);
      imageUrl = supabase.storage.from('batch-materials').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('notices').insert([{ 
      batch_id: batchId, 
      content: content, 
      image_url: imageUrl 
    }]);

    if (!error) {
      setNewNotice(""); 
      setNoticeFile(null); 
      fetchData(); // Refresh list
    }
    setUploading(false);
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return alert("Please fill all fields");
    
    // 1. Create the Event
    const { error } = await supabase.from('events').insert([{ 
      batch_id: batchId, 
      title: eventTitle, 
      event_time: eventDate 
    }]);

    if (!error) {
      // 2. Automatically post a notification about the new event
      const eventTimeString = new Date(eventDate).toLocaleString();
      await handlePostNotice(`🗓️ New Event Scheduled: ${eventTitle} at ${eventTimeString}`);
      
      setShowEventModal(false); 
      setEventTitle(""); 
      setEventDate("");
      fetchData();
    } else {
      alert("Error creating event: " + error.message);
    }
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#fcfcfc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER UI */}
      <nav style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/neet" style={backBtnStyle}>←</Link>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Study Hub</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={statCapsule}>🔥 0</div>
          <div style={statCapsule}>XP {userProfile?.xp_points || 0}</div>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifs(true)}>
            🔔 {notices.length > 0 && <span style={notifBadge}>{notices.length}</span>}
          </div>
          
          {/* PROFILE SECTION: IMAGE + NAME */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <img 
              src={userProfile?.avatar_url || session?.user?.image || "https://ui-avatars.com/api/?name=User"} 
              style={avatarStyle} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              alt="profile"
            />
            <span 
              onClick={() => setShowProfileMenu(!showProfileMenu)} 
              style={{ fontWeight: '600', fontSize: '14px', cursor: 'pointer', color: '#444' }}
            >
              Hi, {userProfile?.student_name || session?.user?.name?.split(' ')[0]}
            </span>

            {showProfileMenu && (
              <div style={dropdownStyle}>
                <Link href="/profile" style={dropdownItem}>My Profile</Link>
                <button onClick={() => signOut()} style={{...dropdownItem, color: 'red', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer'}}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* BANNER */}
      <div style={bannerStyle}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>YOUR BATCH</span>
        <h1 style={{ margin: '5px 0', fontSize: '32px', fontWeight: '900' }}>{batchId.replace(/-/g, ' ').toUpperCase()}</h1>
      </div>

      <main style={{ padding: '0 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <section style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitle}>Batch Offerings</h3>
          <div style={gridStyle}>
            {['All Classes', 'All Tests', 'My Doubts', 'Community'].map(item => (
              <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={offerCard}>
                <span style={{ fontWeight: '700' }}>{item}</span>
                <span>❯</span>
              </Link>
            ))}
          </div>
        </section>

        {/* UPCOMING EVENTS SECTION */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={sectionTitle}>Upcoming Events ({events.length})</h3>
            {isOwner && <button onClick={() => setShowEventModal(true)} style={addEventBtn}>+ Create Event</button>}
          </div>

          {events.length === 0 ? (
            <div style={emptyEventCard}>
               <div style={{ fontSize: '40px' }}>🕒</div>
               <p style={{ fontWeight: 'bold', margin: '10px 0 0' }}>No upcoming events,</p>
               <p style={{ color: '#888', fontSize: '14px' }}>Perfect time to catch up on pending work!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {events.map(ev => (
                <div key={ev.id} style={eventRow}>
                   <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '12px', marginRight: '15px' }}>📅</div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{ev.title}</div>
                     <div style={{ color: '#6157ff', fontSize: '13px', fontWeight: '600' }}>
                        {new Date(ev.event_time).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* NOTIFICATIONS DRAWER */}
      {showNotifs && (
        <div style={overlay} onClick={() => setShowNotifs(false)}>
          <div style={drawer} onClick={e => e.stopPropagation()}>
            <div style={drawerHead}>
              <h3 style={{margin:0}}>Notifications</h3>
              <button onClick={() => setShowNotifs(false)} style={{background:'none', border:'none', fontSize:'20px'}}>✕</button>
            </div>
            
            {isOwner && (
              <div style={{ padding: '20px', background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)} placeholder="Type a message..." style={textAreaStyle} />
                <input type="file" accept="image/*" onChange={e => setNoticeFile(e.target.files?.[0] || null)} style={{marginTop:'10px', fontSize:'12px'}} />
                <button onClick={() => handlePostNotice()} disabled={uploading} style={sendBtn}>
                  {uploading ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            )}

            <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
              {notices.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>No notifications yet.</p>}
              {notices.map((n, i) => (
                <div key={i} style={notifCard}>
                  {n.image_url && <img src={n.image_url} style={{width:'100%', borderRadius:'12px', marginBottom:'10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}} alt="notice" />}
                  <div style={{fontWeight:'600', fontSize:'14px', color:'#333', lineHeight:'1.4'}}>{n.content}</div>
                  <div style={{fontSize:'10px', color:'#bbb', marginTop:'8px', fontWeight:'600'}}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENT CREATOR MODAL */}
      {showEventModal && (
        <div style={{...overlay, justifyContent:'center'}}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Schedule Event/Class</h3>
            <label style={{fontSize:'12px', color:'#666'}}>Event Title</label>
            <input type="text" placeholder="e.g., Organic Chemistry Live" value={eventTitle} onChange={e => setEventTitle(e.target.value)} style={modalInput} />
            <label style={{fontSize:'12px', color:'#666', marginTop:'15px', display:'block'}}>Date & Time</label>
            <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={modalInput} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={handleCreateEvent} style={sendBtn}>Confirm & Notify</button>
              <button onClick={() => setShowEventModal(false)} style={{...sendBtn, background:'#eee', color:'#333'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- STYLES ---
const headerStyle: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 5%', background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 1000 };
const backBtnStyle: any = { textDecoration: 'none', color: '#000', fontSize: '20px', background: '#f5f5f5', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statCapsule: any = { background: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #eee' };
const avatarStyle: any = { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #6157ff', cursor: 'pointer', objectFit: 'cover' };
const bannerStyle: any = { background: '#1c252e', color: '#fff', margin: '20px 5%', padding: '45px 50px', borderRadius: '24px' };
const sectionTitle: any = { fontSize: '18px', fontWeight: '800', color: '#222' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' };
const offerCard: any = { background: '#fff', padding: '22px', borderRadius: '16px', border: '1px solid #f0f0f0', textDecoration: 'none', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const emptyEventCard: any = { background: '#fff', border: '1px dashed #ddd', borderRadius: '24px', padding: '40px', textAlign: 'center' };
const eventRow: any = { background: '#fff', padding: '18px', borderRadius: '18px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const overlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };
const drawer: any = { width: '400px', height: '100%', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' };
const drawerHead: any = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const textAreaStyle: any = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '14px', resize: 'none', background: '#fff' };
const sendBtn: any = { width: '100%', padding: '14px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const notifCard: any = { padding: '16px', borderBottom: '1px solid #f9f9f9' };
const notifBadge: any = { position: 'absolute', top: '-6px', right: '-6px', background: '#ff4d4d', color: '#fff', fontSize: '10px', padding: '2px 5px', borderRadius: '10px', border: '2px solid #fff' };
const dropdownStyle: any = { position: 'absolute', top: '48px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '160px', overflow: 'hidden', border: '1px solid #eee' };
const dropdownItem: any = { display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#444', fontSize: '14px', borderBottom: '1px solid #f9f9f9' };
const modal: any = { background: '#fff', padding: '30px', borderRadius: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const modalInput: any = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '6px', fontSize: '14px' };
const addEventBtn: any = { background: '#6157ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };