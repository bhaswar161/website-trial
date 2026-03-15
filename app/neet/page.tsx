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

  // BATCH DATA WITH HASHTAGS
  const batches = [
    { 
        id: "ultimate-2026", 
        name: "Yakeen NEET 2026", 
        color: "#6c63ff", 
        price: "6,000", 
        tag: "ONLINE",
        hashtags: ["#class 12", "#dropper", "#all"] 
    },
    { 
        id: "crash-course", 
        name: "NEET Crash Course 2026", 
        color: "#ff4ecd", 
        price: "5,500", 
        tag: "ONLINE",
        hashtags: ["#class 11", "#all"] 
    }
  ];

  // Logic to filter batches based on hashtags
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
      `}} />

      {/* HEADER */}
      <header style={headerStyle}>
        <div style={headerInner}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
          </Link>

          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/neet" className="nav-link" style={{color: '#5b6cfd'}}>Dashboard</Link>
            <Link href="#" className="nav-link">Books</Link>
            <Link href="#" className="nav-link">Results</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={session?.user?.image || `https://ui-avatars.com/api/?name=${displayName}`} style={avatarStyle} />
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
        <div style={{ marginBottom: '30px' }}>
          <button onClick={() => router.back()} style={backBtnCircle}>←</button>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '42px', fontWeight: '900', color: '#1c252e', marginBottom: '15px' }}>
            NEET Online Preparation
          </motion.h1>
          <p style={{ color: '#666', maxWidth: '800px', lineHeight: '1.6', fontSize: '17px' }}>
            Filter by your class to find targeted StudyHub courses, practice questions, and mock tests.
          </p>
        </div>

        {/* ANIMATED RESOURCE CARDS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
          {[
            { label: 'Blogs', sub: 'Read our latest updates', bg: '#f0f4ff' },
            { label: 'PDF Bank', sub: 'Access free notes', bg: '#fff0f3' },
            { label: 'Test Series', sub: 'Practice with Mocks', bg: '#eefcf1' },
            { label: 'Books', sub: 'Find NEET reference', bg: '#f0f8ff' }
          ].map((item) => (
            <motion.div key={item.label} whileHover={{ y: -8, scale: 1.02 }} style={{ ...resourceBox, background: item.bg }}>
              <div><b style={{display:'block', fontSize: '18px'}}>{item.label}</b><small style={{color:'#666'}}>{item.sub}</small></div>
              <span style={arrowIcon}>→</span>
            </motion.div>
          ))}
        </div>

        {/* HASHTAG FILTERS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px', flexWrap: 'wrap' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button 
                key={tag} 
                onClick={() => setActiveFilter(tag)} 
                className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}
            >
                {tag.replace('#', '')}
            </button>
          ))}
        </div>

        {/* DYNAMIC BATCH GRID */}
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '30px', textTransform: 'capitalize' }}>
            {activeFilter === "#all" ? "All" : activeFilter.replace('#', '')} NEET Courses
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
          {filteredBatches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
            return (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ y: -10 }} key={batch.id} style={cardStyle}>
                <div style={{ background: batch.color, padding: '15px 25px', color: '#fff', position: 'relative' }}>
                  <span style={badgeStyle}>{batch.tag}</span>
                  <h3 style={{ margin: '20px 0 10px', fontSize: '22px', fontWeight: '800' }}>{batch.name}</h3>
                </div>
                <div style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '900', color: '#1c252e' }}>FREE</span>
                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '18px' }}>₹{batch.price}</span>
                  </div>
                  {isEnrolled ? (
                    <Link href={`/neet/${batch.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{ ...actionBtn, border: `2px solid ${batch.color}`, color: batch.color, background: 'white' }}>EXPLORE BATCH</button>
                    </Link>
                  ) : (
                    <button onClick={() => handleEnroll(batch.id)} style={{ ...actionBtn, background: batch.color, color: 'white' }}>ENROLL NOW</button>
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {filteredBatches.length === 0 && (
            <p style={{ color: '#999', fontSize: '18px' }}>No batches found for this category yet.</p>
          )}
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
const resourceBox: any = { flex: '1', minWidth: '240px', padding: '25px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const arrowIcon: any = { background: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const cardStyle: any = { background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const badgeStyle: any = { position: 'absolute', top: '15px', left: '25px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' };
const actionBtn: any = { width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '900', border: 'none', cursor: 'pointer', transition: '0.2s' };