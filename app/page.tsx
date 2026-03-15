'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomePage() {
  const { data: session } = useSession();
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Competitive");

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    const updateProfile = () => {
      setCustomName(localStorage.getItem("userFirstName") || "");
      setProfilePic(localStorage.getItem("userProfilePic") || "");
    };
    updateProfile(); 
  }, []);

  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  const categories = [
    { id: "Competitive", title: "Competitive Exams", sub: "JEE, NEET, GATE", items: [{name: "NEET", href: "/neet"}, {name: "IIT JEE", href: "#"}] },
    { id: "School", title: "School Preparation", sub: "Class 9-12", items: [{name: "Class 12", href: "#"}, {name: "Class 11", href: "#"}] },
  ];

  return (
    <div style={{ background: '#fcfdfe', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* PREMIUM HEADER */}
      <header style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#5b6cfd', margin: 0 }}>StudyHub</h1>
            </Link>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              {/* MEGA MENU */}
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={megaMenuPanel}>
                      <div style={{ display: 'flex', height: '350px' }}>
                        <div style={megaLeft}>
                          {categories.map(cat => (
                            <div 
                              key={cat.id}
                              onMouseEnter={() => setActiveCategory(cat.id)}
                              style={{ ...categoryItem, background: activeCategory === cat.id ? '#fff' : 'transparent' }}
                            >
                              <b style={{ display: 'block', fontSize: '14px' }}>{cat.title}</b>
                              <small style={{ color: '#888' }}>{cat.sub}</small>
                            </div>
                          ))}
                        </div>
                        <div style={megaRight}>
                          {categories.find(c => c.id === activeCategory)?.items.map(item => (
                            <Link href={item.href} key={item.name} style={{ textDecoration: 'none' }}>
                              <motion.div whileHover={{ y: -3, background: '#f8f9ff' }} style={courseCardMini}>
                                {item.name}
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isOwner && <Link href="/neet" style={navLink}>Live Dashboard</Link>}
              <Link href="#" style={navLink}>Books</Link>
              <Link href="#" style={navLink}>Results</Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {session ? (
              <div style={{ position: 'relative' }}>
                <div style={profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800' }}>Hi, {displayName}</div>
                    <div style={roleBadge}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
                  </div>
                  <img src={profilePic || session.user?.image || `https://ui-avatars.com/api/?name=${displayName}`} style={navAvatar} />
                </div>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={dropdownMenu}>
                      <Link href="/profile" style={dropdownItem}>👤 My Profile</Link>
                      <button onClick={() => signOut()} style={dropdownLogoutBtn}>🚪 Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button style={loginBtn} onClick={() => signIn('google')}>Login / Register</button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main style={{ paddingTop: '80px' }}>
        <div style={heroSection}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ fontSize: '50px', fontWeight: '900', color: '#fff' }}>
                {session ? (isOwner ? `Welcome, Faculty ${displayName}!` : `Welcome back, ${displayName}!`) : "Crack NEET, JEE & Boards"}
              </motion.h1>
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', margin: '20px 0 30px' }}>
                {isOwner ? "Manage your batches and start your live interactions." : "Free notes, MCQs, mock tests and revision for Class 11 & 12."}
              </p>
              <button style={heroBtn} onClick={() => session ? window.location.href='/neet' : signIn('google')}>
                {session ? "Go to Dashboard" : "Start Learning"}
              </button>
            </div>
            <motion.img animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }} src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" style={{ width: '350px' }} />
          </div>
        </div>

        {/* POPULAR COURSES */}
        <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '900', marginBottom: '50px' }}>Popular Courses</h2>
          <div style={courseGrid}>
            {['Class 11', 'Class 12', 'NEET'].map((title) => (
              <div key={title} style={popularCard}>
                <h3 style={{ color: '#5b6cfd', fontWeight: '800' }}>{title}</h3>
                <p style={{ color: '#666', margin: '15px 0' }}>{title === 'NEET' ? 'MCQs & Mock Tests' : 'Boards Preparation'}</p>
                <Link href="/neet" style={cardBtn}>Explore</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

// --- STYLES ---
const headerWrapper: any = { position:'fixed', top:0, left:0, width:'100%', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)', zIndex: 1000, height: '80px', borderBottom: '1px solid #f0f0f0' };
const headerInner: any = { maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' };
const allCoursesBtn: any = { border: '2px solid #5b6cfd', padding: '8px 16px', borderRadius: '12px', color: '#5b6cfd', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const navLink: any = { textDecoration: 'none', color: '#444', fontWeight: '600', fontSize: '15px' };
const megaMenuPanel: any = { position: 'absolute', top: '100%', left: 0, width: '700px', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflow: 'hidden' };
const megaLeft: any = { width: '40%', background: '#f8f9fb', padding: '20px' };
const megaRight: any = { width: '60%', padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const categoryItem: any = { padding: '15px', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px' };
const courseCardMini: any = { padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0', fontWeight: '700', color: '#1c252e', textAlign: 'center' };
const navAvatar: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #5b6cfd' };
const profileTrigger: any = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' };
const roleBadge: any = { fontSize: '9px', fontWeight: '900', color: '#5b6cfd', background: '#f0f3ff', padding: '2px 6px', borderRadius: '5px' };
const heroSection: any = { background: 'linear-gradient(135deg, #6a1b9a, #ff4ecd)', padding: '100px 40px 140px', borderRadius: '0 0 80px 80px' };
const heroBtn: any = { padding: '16px 35px', background: '#fff', color: '#6a1b9a', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const courseGrid: any = { display: 'flex', gap: '30px' };
const popularCard: any = { flex: 1, background: '#fff', padding: '40px', borderRadius: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const cardBtn: any = { display: 'inline-block', padding: '10px 25px', background: '#5b6cfd', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' };
const loginBtn: any = { background: '#5b6cfd', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const dropdownMenu: any = { position: 'absolute', top: '60px', right: '0', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: '15px', padding: '10px', minWidth: '160px' };
const dropdownItem: any = { display: 'block', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '700', fontSize: '14px' };
const dropdownLogoutBtn: any = { width: '100%', textAlign: 'left', padding: '10px', background: 'none', border: 'none', color: '#ff4757', fontWeight: '800', cursor: 'pointer' };
const backBtnCircle: any = { color:'#333', background:'#f5f5f5', width:'35px', height:'35px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' };