"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

export default function NeetPage() {
  const { data: session, status } = useSession()
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("#all");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
  }, []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";
  const displayName = session?.user?.name?.split(' ')[0] || "Student";

  useEffect(() => {
    setMounted(true)
    if (!session?.user?.email) return;

    const fetchData = async () => {
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('batch_id')
        .eq('student_email', session.user.email);
      if (enrolls) setEnrolledBatches(enrolls.map(e => e.batch_id));
    };
    fetchData();
  }, [session, supabase]);

  const handleEnroll = async (batchId: string) => {
    if (!session?.user?.email) return;
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_email: session.user.email, batch_id: batchId }]);
    if (!error || (error as any).code === '23505') {
      setEnrolledBatches(prev => [...prev, batchId]);
    }
  };

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

  const batches = [
    { 
        id: "ultimate-2026", 
        name: "Yakeen NEET 2026", 
        color: "#6c63ff", 
        price: "6,000", 
        discounted: "4,800",
        tag: "ONLINE",
        hashtags: ["#class 12", "#dropper", "#all"],
        banner: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=500&auto=format&fit=crop"
    },
    { 
        id: "crash-course", 
        name: "NEET Crash Course 2026", 
        color: "#ff4ecd", 
        price: "5,500", 
        discounted: "3,500",
        tag: "ONLINE",
        hashtags: ["#class 11", "#all"],
        banner: "https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=500&auto=format&fit=crop"
    }
  ];

  const filteredBatches = batches.filter(batch => 
    batch.hashtags.includes(activeFilter.toLowerCase())
  );

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link { text-decoration: none; color: #444; font-weight: 600; font-size: 15px; transition: 0.2s; }
        .nav-link:hover { color: #5b6cfd; }
        .filter-btn { background: none; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #888; transition: 0.2s; border-radius: 12px; text-transform: capitalize; }
        .filter-btn.active { color: #5b6cfd; background: #f0f3ff; box-shadow: 0 4px 10px rgba(91, 108, 253, 0.1); }
        
        .premium-bar { background: #1c252e; color: white; padding: 8px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin: 15px 0; }
        .infinity-badge { background: linear-gradient(90deg, #d4af37, #f9e29c); color: #1c252e; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 10px; }
        .discount-tag { background: #eefcf1; color: #27ae60; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 5px; }
      `}} />

      <header style={headerStyle}>
        <div style={headerInner}>
          <Link href="/" style={{ textDecoration: 'none' }}><h1 style={{ fontSize: '24px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1></Link>
          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/neet" className="nav-link" style={{color: '#5b6cfd'}}>Dashboard</Link>
            <Link href="#" className="nav-link">Books</Link>
            <Link href="#" className="nav-link">Results</Link>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={session?.user?.image || ""} style={avatarStyle} />
              <div style={{ lineHeight: '1.2' }}>
                <div style={{ fontWeight: '800', fontSize: '14px' }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: 'bold' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
              </div>
            </Link>
            <button onClick={() => signOut()} style={logoutBtn}>Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '30px' }}><button onClick={() => router.back()} style={backBtnCircle}>←</button></div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}>{tag.replace('#', '')}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '30px' }}>
          {filteredBatches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} key={batch.id} style={cardStyle}>
                {/* Banner Image */}
                <div style={{ position: 'relative', height: '180px', background: '#eee' }}>
                  <img src={batch.banner} alt={batch.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ ...badgeStyle, background: batch.color }}>{batch.tag}</span>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1c252e', margin: 0 }}>{batch.name}</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <span style={{ background: '#f5f5f5', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Hinglish</span>
                        <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '18px' }} alt="wa" />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', color: '#666', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>👥 For NEET Aspirants</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Starts on 13 Apr, 2026</div>
                  </div>

                  <div className="premium-bar">
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Premium Features <small style={{ opacity: 0.8 }}>Included</small></span>
                    <span className="infinity-badge">INFINITY</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '20px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: '#5b6cfd' }}>₹{batch.discounted}</span>
                      <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '14px' }}>₹{batch.price}</span>
                    </div>
                    <div className="discount-tag">🏷️ Discount Applied</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href={`/neet/${batch.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{ ...actionBtn, background: 'white', color: batch.color, border: `1.5px solid ${batch.color}` }}>EXPLORE</button>
                    </Link>
                    {!isEnrolled && (
                      <button onClick={() => handleEnroll(batch.id)} style={{ ...actionBtn, flex: 1, background: batch.color, color: 'white' }}>BUY NOW</button>
                    )}
                    {isEnrolled && (
                      <button style={{ ...actionBtn, flex: 1, background: '#27ae60', color: 'white' }}>ENROLLED</button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

// --- STYLES ---
const headerStyle: any = { position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #eee' };
const headerInner: any = { maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const avatarStyle: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' };
const logoutBtn: any = { background: '#ff4757', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'none', fontSize:'20px', cursor: 'pointer' };
const cardStyle: any = { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' };
const badgeStyle: any = { position: 'absolute', top: '10px', left: '10px', color: '#fff', padding: '4px 12px', borderRadius: '6px 0 6px 0', fontSize: '10px', fontWeight: 'bold' };
const actionBtn: any = { width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', transition: '0.2s', fontSize: '14px' };