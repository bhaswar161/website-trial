"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("All");

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
    { id: "ultimate-2026", name: "Yakeen NEET 2026", color: "#6c63ff", price: "6,000", tag: "ONLINE" },
    { id: "crash-course", name: "NEET Crash Course 2026", color: "#ff4ecd", price: "5,500", tag: "ONLINE" }
  ];

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link { text-decoration: none; color: #444; font-weight: 600; font-size: 15px; transition: 0.2s; }
        .nav-link:hover { color: #5b6cfd; }
        .resource-card { flex: 1; padding: 25px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; text-decoration: none; transition: 0.3s; border: 1px solid rgba(0,0,0,0.03); }
        .resource-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .filter-btn { background: none; border: none; padding: 8px 15px; cursor: pointer; font-weight: 600; color: #888; transition: 0.2s; border-radius: 8px; }
        .filter-btn.active { color: #5b6cfd; background: #f0f3ff; }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={session?.user?.image || ""} style={avatarStyle} />
              <div style={{ lineHeight: '1.2' }}>
                <div style={{ fontWeight: '800', fontSize: '14px' }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: 'bold' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
              </div>
            </div>
            <button onClick={() => signOut()} style={logoutBtn}>Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* BREADCRUMB */}
        <div style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
          🏠 &nbsp; / &nbsp; NEET
        </div>

        {/* TITLE SECTION */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1c252e', marginBottom: '15px' }}>
            NEET 2026 Online Preparation
          </h1>
          <p style={{ color: '#666', maxWidth: '800px', lineHeight: '1.6' }}>
            StudyHub brings together dedicated courses for every stage, thousands of practice questions and mock tests, and flexible learning through live and recorded classes for NEET 2026 aspirants.
          </p>
        </div>

        {/* RESOURCE CARDS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
          <div style={{ ...resourceBox, background: '#f0f4ff' }}>
            <div><b style={{display:'block'}}>Blogs</b><small style={{color:'#666'}}>Read our latest updates</small></div>
            <span style={arrowIcon}>→</span>
          </div>
          <div style={{ ...resourceBox, background: '#fff0f3' }}>
            <div><b style={{display:'block'}}>PDF Bank</b><small style={{color:'#666'}}>Access free notes</small></div>
            <span style={arrowIcon}>→</span>
          </div>
          <div style={{ ...resourceBox, background: '#eefcf1' }}>
            <div><b style={{display:'block'}}>Test Series</b><small style={{color:'#666'}}>Practice with Mocks</small></div>
            <span style={arrowIcon}>→</span>
          </div>
          <div style={{ ...resourceBox, background: '#f0f8ff' }}>
            <div><b style={{display:'block'}}>Books</b><small style={{color:'#666'}}>Find NEET reference</small></div>
            <span style={arrowIcon}>→</span>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          {["All", "class 11", "class 12", "dropper"].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`filter-btn ${activeFilter === f ? 'active' : ''}`}>{f}</button>
          ))}
        </div>

        {/* BATCH GRID */}
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px' }}>{activeFilter} NEET Courses</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
          {batches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
            return (
              <motion.div whileHover={{ y: -10 }} key={batch.id} style={cardStyle}>
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
        </div>
      </main>
    </div>
  )
}

// --- STYLES ---
const headerStyle: any = { position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #eee' };
const headerInner: any = { maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const avatarStyle: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #5b6cfd' };
const logoutBtn: any = { background: '#ff4757', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const resourceBox: any = { flex: '1', minWidth: '200px', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const arrowIcon: any = { background: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const cardStyle: any = { background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const badgeStyle: any = { position: 'absolute', top: '15px', left: '25px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' };
const actionBtn: any = { width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '900', border: 'none', cursor: 'pointer', transition: '0.2s' };