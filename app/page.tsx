"use client";
import { useSession, signOut } from "next-auth/react"
import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function Homepage() {
  const { data: session } = useSession()
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Competitive")

  const categories = [
    { id: "Competitive", title: "Competitive Exams", sub: "NEET, IIT JEE, GATE", items: ["NEET 2026", "NEET 2025", "IIT JEE", "GATE"] },
    { id: "Boards", title: "School Boards", sub: "CBSE, ICSE, State", items: ["Class 12 Boards", "Class 11 Boards", "Class 10 Prep"] },
    { id: "Upskilling", title: "Upskilling", sub: "Coding, Soft Skills", items: ["Web Dev", "Python", "Communication"] }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fcfdfe', fontFamily: 'sans-serif' }}>
      
      {/* IMPROVED HEADER WITH MEGA MENU */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              {/* MEGA MENU WRAPPER */}
              <div 
                onMouseEnter={() => setShowMegaMenu(true)} 
                onMouseLeave={() => setShowMegaMenu(false)}
                style={{ position: 'relative', padding: '10px 0' }}
              >
                <div style={allCoursesBtn}>
                  All Courses <motion.span animate={{ rotate: showMegaMenu ? 180 : 0 }}>▾</motion.span>
                </div>

                <AnimatePresence>
                  {showMegaMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={megaMenuPanel}
                    >
                      <div style={{ display: 'flex', height: '400px' }}>
                        {/* LEFT SIDE: CATEGORIES */}
                        <div style={megaLeft}>
                          {categories.map(cat => (
                            <div 
                              key={cat.id}
                              onMouseEnter={() => setActiveCategory(cat.id)}
                              style={{
                                ...categoryItem,
                                background: activeCategory === cat.id ? '#fff' : 'transparent',
                                boxShadow: activeCategory === cat.id ? '0 4px 15px rgba(0,0,0,0.05)' : 'none'
                              }}
                            >
                              <b style={{ display: 'block', fontSize: '14px' }}>{cat.title}</b>
                              <small style={{ color: '#888' }}>{cat.sub}</small>
                            </div>
                          ))}
                        </div>

                        {/* RIGHT SIDE: SPECIFIC COURSES */}
                        <div style={megaRight}>
                          {categories.find(c => c.id === activeCategory)?.items.map(item => (
                            <Link href="/neet" key={item} style={{ textDecoration: 'none' }}>
                              <motion.div whileHover={{ y: -3, background: '#f8f9ff' }} style={courseCard}>
                                {item}
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="#" style={navLink}>Books</Link>
              <Link href="#" style={navLink}>Results</Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {session ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontWeight: '700', fontSize: '14px' }}>Hi, {session.user?.name?.split(' ')[0]}</span>
                 <button onClick={() => signOut()} style={logoutBtn}>Logout</button>
               </div>
            ) : (
               <Link href="/login" style={loginBtn}>Login/Register</Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (AS SEEN IN YOUR SS) */}
      <main style={{ paddingTop: '120px' }}>
        <div style={heroBanner}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', textAlign: 'center' }}>Popular Courses</h2>
        </div>

        <div style={courseGrid}>
          {['Class 11', 'Class 12', 'NEET'].map((title) => (
            <div key={title} style={popularCard}>
               <h3 style={{ color: '#5b6cfd', fontWeight: '800' }}>{title}</h3>
               <p style={{ color: '#666', fontSize: '14px', margin: '15px 0' }}>
                 {title === 'NEET' ? 'MCQs, PYQs and Mock Tests' : 'Boards + Competitive Prep'}
               </p>
               <Link href="/neet">
                <button style={exploreBtn}>Explore</button>
               </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// --- STYLE DEFINITIONS ---
const headerWrapper: any = { position: 'fixed', top: 0, left: 0, width: '100%', background: '#fff', zIndex: 1000, height: '80px', borderBottom: '1px solid #f0f0f0' };
const headerInner: any = { maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' };
const allCoursesBtn: any = { border: '2px solid #5b6cfd', padding: '10px 20px', borderRadius: '14px', color: '#5b6cfd', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const navLink: any = { textDecoration: 'none', color: '#444', fontWeight: '600', fontSize: '15px' };
const megaMenuPanel: any = { position: 'absolute', top: '100%', left: 0, width: '800px', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000 };
const megaLeft: any = { width: '35%', background: '#f8f9fb', padding: '20px' };
const megaRight: any = { width: '65%', padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', overflowY: 'auto' };
const categoryItem: any = { padding: '15px', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px', transition: '0.2s' };
const courseCard: any = { padding: '18px', borderRadius: '15px', border: '1px solid #f0f0f0', fontWeight: '700', color: '#1c252e' };
const loginBtn: any = { background: '#5b6cfd', color: '#fff', padding: '10px 25px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none' };
const logoutBtn: any = { background: '#ff5b5b', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const heroBanner: any = { background: 'linear-gradient(to right, #9c42f5, #ff5b84)', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', borderRadius: '0 0 100px 100px', marginBottom: '60px' };
const courseGrid: any = { display: 'flex', justifyContent: 'center', gap: '30px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' };
const popularCard: any = { background: '#fff', padding: '40px', borderRadius: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', flex: 1, border: '1px solid #f0f0f0' };
const exploreBtn: any = { background: '#7c72ff', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };