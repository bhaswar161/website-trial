"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'

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

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

  const batches = [
    { 
        id: "ultimate-2026", 
        name: "Yakeen NEET 2026", 
        color: "#6c63ff", 
        tag: "ONLINE",
        hashtags: ["#class 12", "#dropper", "#all"],
        banner: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=500"
    },
    { 
        id: "crash-course", 
        name: "NEET Crash Course 2026", 
        color: "#ff4ecd", 
        tag: "ONLINE",
        hashtags: ["#class 11", "#all"],
        banner: "https://images.unsplash.com/photo-1532187863486-abf9d39d9995?q=80&w=500"
    }
  ];

  const filteredBatches = batches.filter(batch => 
    batch.hashtags.includes(activeFilter.toLowerCase())
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 5%;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; zIndex: 1000; height: 80px;
        }
        .nav-center ul { display: flex; gap: 30px; list-style: none; align-items: center; }
        .nav-link { text-decoration: none; color: #444; font-weight: 600; font-size: 15px; }
        .nav-link:hover { color: #5b6cfd; }
        .filter-btn { background: #fff; border: 1px solid #e2e8f0; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #64748b; border-radius: 10px; text-transform: uppercase; font-size: 12px; }
        .filter-btn.active { color: #fff; background: #5b6cfd; border-color: #5b6cfd; }
        .resource-card { flex: 1; minWidth: 220px; padding: 20px; border-radius: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid #f1f5f9; }
      `}} />

      {/* HEADER */}
      <header>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>

        <nav className="nav-center">
          <ul>
            <Link href="/" className="nav-link">Home</Link>
            {isOwner ? (
                <Link href="/admin" className="nav-link" style={{color:'#ff4757', fontWeight: 800}}>Admin Panel</Link>
            ) : (
                <Link href="/neet" className="nav-link" style={{color:'#5b6cfd'}}>Dashboard</Link>
            )}
            <li className="nav-link">Books</li>
            <li className="nav-link">Results</li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifySelf: 'end' }}>
          <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={session?.user?.image || ""} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #5b6cfd' }} />
            <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1c252e' }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: 'bold' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
            </div>
          </Link>
          <button onClick={() => signOut()} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* BACK BUTTON */}
        <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', marginBottom: '30px', fontSize: '20px' }}>←</button>

        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>NEET Online Preparation</h1>
        <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '17px', maxWidth: '800px', lineHeight: '1.6' }}>
            Access dedicated NEET courses, thousands of practice questions, and flexible learning through live and recorded classes.
        </p>

        {/* RESOURCE CARDS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '50px', flexWrap: 'wrap' }}>
            <motion.div whileHover={{y:-5}} className="resource-card" style={{background: '#f0f7ff'}}>
                <div><b style={{display:'block'}}>Blogs</b><small>Read latest updates</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-5}} className="resource-card" style={{background: '#fff1f2'}}>
                <div><b style={{display:'block'}}>PDF Bank</b><small>Access free notes</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-5}} className="resource-card" style={{background: '#f0fdf4'}}>
                <div><b style={{display:'block'}}>Test Series</b><small>Practice mocks</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-5}} className="resource-card" style={{background: '#f8fafc'}}>
                <div><b style={{display:'block'}}>Books</b><small>Find references</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center'}}>→</div>
            </motion.div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}>{tag.replace('#', '')}</button>
          ))}
        </div>

        {/* BATCH GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '30px' }}>
          {filteredBatches.map((batch) => {
            const isEnrolled = isOwner || enrolledBatches.includes(batch.id);
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={batch.id} style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ height: '200px', position: 'relative' }}>
                  <img src={batch.banner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                  <div style={{ position: 'absolute', top: '15px', left: '15px', background: batch.color, color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{batch.tag}</div>
                </div>

                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{batch.name}</h3>
                    <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '20px' }} />
                  </div>

                  {isOwner && (
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                      {batch.hashtags.map(t => <span key={t} style={{fontSize:'10px', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px'}}>{t}</span>)}
                    </div>
                  )}

                  <div style={{ marginBottom: '25px' }}><span style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>FREE</span></div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href={`/neet/${batch.id}`} style={{ flex: 1 }}>
                      <button style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', background: '#fff', border: `2px solid ${batch.color}`, color: batch.color, cursor: 'pointer' }}>EXPLORE</button>
                    </Link>
                    <button style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 'bold', background: isEnrolled ? '#10b981' : batch.color, color: '#fff', border: 'none' }}>
                      {isEnrolled ? "ENROLLED" : "ENROLL NOW"}
                    </button>
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