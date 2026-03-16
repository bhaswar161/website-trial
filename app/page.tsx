'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../context/ThemeContext" // Accessing Global Theme

export default function HomePage() {
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme(); // Global Theme Hook
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Competitive");
  const examSectionRef = useRef<HTMLDivElement>(null);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    const updateProfile = () => {
      setCustomName(localStorage.getItem("userFirstName") || "");
      setProfilePic(localStorage.getItem("userProfilePic") || "");
    };
    updateProfile(); 
    window.addEventListener('storage', updateProfile);
    return () => window.removeEventListener('storage', updateProfile);
  }, []);

  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  const handleStartLearning = () => {
    if (!session) {
      signIn('google');
    } else {
      examSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Theme-aware colors
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#fcfdfe',
    header: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#666',
    border: isDarkMode ? '#334155' : 'rgba(0,0,0,0.05)',
    card: isDarkMode ? '#1e293b' : 'white'
  };

  const megaMenuData = [
    { id: "Competitive", title: "Exams", sub: "NEET & JEE Prep", items: [{ name: "NEET Preparation", href: "/neet" }, { name: "IIT JEE Mains & Adv", href: "#" }] },
    { id: "School", title: "School Prep", sub: "Class 11 & 12 Boards", items: [{ name: "Class 11 Boards", href: "#" }, { name: "Class 12 Boards", href: "#" }] },
  ];

  const examCategories = [
    { title: "NEET", pills: ["class 11", "class 12", "Dropper"], href: "/neet", icon: "https://cdn-icons-png.flaticon.com/512/3063/3063200.png" },
    { title: "IIT JEE", pills: ["class 11", "class 12", "Dropper"], href: "#", icon: "https://cdn-icons-png.flaticon.com/512/4341/4341139.png" },
    { title: "School Boards", pills: ["CBSE", "ICSE", "State Boards"], href: "#", icon: "https://cdn-icons-png.flaticon.com/512/2941/2941513.png" }
  ];

  const floatingAssets = [
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/1048/1048954.png", top: "12%", left: "6%", size: "110px" }, 
    { type: 'text', content: "E = mc²", top: "18%", left: "75%", rotate: 12, size: "42px" },
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/3022/3022588.png", top: "68%", left: "4%", size: "125px" }, 
    { type: 'text', content: "ax² + bx + c", top: "10%", left: "38%", rotate: -8, size: "36px" },
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/862/862031.png", top: "48%", left: "88%", size: "100px" }, 
    { type: 'text', content: "sin θ", top: "75%", left: "45%", rotate: 15, size: "38px" },
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/3063/3063205.png", top: "72%", left: "14%", size: "115px" }, 
    { type: 'pencil', content: "✏️", top: "28%", left: "18%", rotate: 45, size: "55px" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', Roboto, sans-serif; transition: background-color 0.4s ease, color 0.4s ease; }
        body { background:${theme.bg}; overflow-x: hidden; scroll-behavior: smooth; }

        header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 5%;
          background: ${theme.header};
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${theme.border};
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 80px;
        }

        .logo { font-weight:900; font-size:24px; color:#5b6cfd; text-decoration:none; letter-spacing: -0.8px; justify-self: start; }
        .nav-center li { cursor: pointer; color: ${theme.text}; font-weight: 600; font-size: 15px; opacity: 0.8; }
        .nav-center li:hover { opacity: 1; color: #5b6cfd; }

        .auth-section { justify-self: end; display: flex; align-items: center; gap: 15px; }
        .theme-toggle { background: ${isDarkMode ? '#334155' : '#eef2ff'}; border: none; width: 45px; height: 45px; border-radius: 12px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .all-courses-btn { border:2px solid #5b6cfd; padding:8px 16px; border-radius:12px; color:#5b6cfd; font-weight:700; display:flex; align-items:center; gap:8px; cursor: pointer; }
        
        .mega-menu { 
          position:absolute; top:75px; left: 50%; transform: translateX(-50%); width: 550px; background:${isDarkMode ? '#1e293b' : 'white'}; 
          border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.2); 
          overflow:hidden; z-index: 2000; border: 1px solid ${theme.border};
        }
        
        .mega-left { width:40%; background:${isDarkMode ? '#0f172a' : '#f9fafb'}; padding:20px; border-right: 1px solid ${theme.border}; }
        .mega-right { width:60%; padding:20px; display:grid; grid-template-columns: 1fr; gap:10px; overflow-y: auto; }
        .course-item { padding:12px; border-radius:12px; font-weight:700; text-decoration:none; color:${theme.text}; border: 1px solid ${theme.border}; transition: 0.2s; text-align: center; background: ${isDarkMode ? '#1e293b' : '#fff'}; }

        .hero { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 120px 10% 160px; background: ${isDarkMode ? 'linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)' : 'linear-gradient(135deg, #6a1b9a, #ff4ecd, #5b6cfd)'}; 
          background-size: 400% 400%; animation: gradientShift 10s ease infinite;
          border-radius: 0 0 100px 100px; color: white; position: relative; overflow: hidden;
        }

        .hero-btn { padding: 18px 45px; border: none; border-radius: 16px; background: white; color: #5b6cfd; font-weight: 900; font-size: 18px; cursor: pointer; box-shadow: 0 15px 30px rgba(0,0,0,0.2); transition: 0.3s; z-index: 10; }

        .section-title { font-size: 48px; font-weight: 950; color: ${theme.text}; margin-bottom: 10px; letter-spacing: -1.5px; }
        .section-sub { color: ${theme.subtext}; font-size: 18px; margin-bottom: 60px; max-width: 700px; margin-left: auto; margin-right: auto; }

        .cat-card { 
            background: ${theme.card}; border-radius: 32px; padding: 45px; 
            text-align: left; position: relative; overflow: hidden; 
            border: 1px solid ${theme.border}; box-shadow: 0 10px 40px rgba(0,0,0,0.04); 
            transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer;
        }
        .cat-card:hover { transform: translateY(-15px); border-color: #5b6cfd; box-shadow: 0 25px 60px rgba(91, 108, 253, 0.2); }
        .balloon-bg { position: absolute; top: 0; right: -15%; width: 200px; height: 200px; background: ${isDarkMode ? 'rgba(91,108,253,0.1)' : '#fff1f5'}; border-radius: 50%; z-index: 0; pointer-events: none; }
        .cat-title { color: ${theme.text}; }
        .pill { background: ${isDarkMode ? '#334155' : '#f4f6ff'}; color: #5b6cfd; border: 1px solid ${theme.border}; }
      ` }} />

      <header>
        <Link href="/" className="logo">StudyHub</Link>

        <nav className="nav-center">
          <ul>
            <li className="mega-wrapper" onMouseEnter={() => setShowMegaMenu(true)} onMouseLeave={() => setShowMegaMenu(false)}>
              <div className="all-courses-btn">All Courses <motion.div animate={{ rotate: showMegaMenu ? 180 : 0 }} style={{width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'6px solid #5b6cfd'}}></motion.div></div>
              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mega-menu">
                    <div className="mega-container">
                      <div className="mega-left">
                        {megaMenuData.map(cat => (
                          <div key={cat.id} onMouseEnter={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? (isDarkMode ? '#334155' : 'white') : 'transparent', color: activeCategory === cat.id ? '#5b6cfd' : theme.text, boxShadow: activeCategory === cat.id ? '0 10px 20px rgba(0,0,0,0.1)' : 'none' }}>
                            <b style={{fontSize: '15px'}}>{cat.title}</b><br/><small style={{opacity: 0.6}}>{cat.sub}</small>
                          </div>
                        ))}
                      </div>
                      <div className="mega-right">
                        {megaMenuData.find(c => c.id === activeCategory)?.items.map((item, idx) => (
                          <Link href={item.href} key={idx} className="course-item">{item.name}</Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
            {session && <li><Link href={isOwner ? "/admin" : "/neet"} style={{ color: isOwner ? '#ff4757' : '#5b6cfd', fontWeight: '800', textDecoration: 'none' }}>{isOwner ? 'Admin Panel' : 'Dashboard'}</Link></li>}
            <li>Books</li>
            <li>Results</li>
          </ul>
        </nav>

        <div className="auth-section">
          {/* THE MASTER TOGGLE BUTTON */}
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/profile" className="profile-link-area">
                <img src={profilePic || session.user?.image || ""} style={{width:'45px', height:'45px', borderRadius:'50%', border:'2px solid #5b6cfd', objectFit: 'cover'}} />
                <div style={{textAlign: 'left'}}>
                   <div style={{fontWeight:'800', fontSize:'15px', color: theme.text}}>Hi, {displayName}</div>
                   <div style={{fontSize:'10px', fontWeight:'900', color:'#5b6cfd'}}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
                </div>
              </Link>
              <button className="logout-btn" onClick={() => signOut()}>Logout</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => signIn('google')}>Login / Register</button>
          )}
        </div>
      </header>

      <div className="hero">
        {floatingAssets.map((el, i) => (
          <motion.div key={i} className={el.type === 'text' ? 'sketch-text-asset' : 'sketch-asset'} style={{ top: el.top, left: el.left, fontSize: el.size || '24px', width: el.type === 'img' ? el.size : 'auto' }} animate={{ y: [0, -30, 0], rotate: [0, 12, -12, 0], opacity: el.type === 'text' ? [0.2, 0.4, 0.2] : [0.3, 0.6, 0.3] }} transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}>
            {el.type === 'img' ? <img src={el.src} style={{width: '100%'}} alt="science" /> : el.content}
          </motion.div>
        ))}

        <div className="hero-text" style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
          <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            {session ? `Welcome back, ${displayName}!` : "Crack NEET, JEE & Boards"}
          </motion.h1>
          <p style={{fontSize: '18px', lineHeight: '1.6', marginBottom: '30px', opacity: 0.9}}>Master complex concepts with premium notes and daily interactive classes from top faculty.</p>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} animate={{ boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.4)", "0 0 0px rgba(255,255,255,0)"] }} transition={{ repeat: Infinity, duration: 2 }} className="hero-btn" onClick={handleStartLearning}>
            {session ? "Start Learning Now" : "Join StudyHub Today"}
          </motion.button>
        </div>
        <motion.img animate={{ y: [0, -25, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" style={{width:'440px', position: 'relative', zIndex: 6}} />
      </div>

      <div className="section" id="categories" ref={examSectionRef}>
        <h2 className="section-title">Explore Your Path</h2>
        <p className="section-sub">Achieve your dreams with our goal-oriented courses. Whether you're aiming for medical school, engineering, or top board scores, we provide the ultimate learning framework.</p>
        
        <div className="category-grid">
          {examCategories.map((cat, idx) => (
            <motion.div whileHover="hover" key={idx} className="cat-card" onClick={() => window.location.href = cat.href}>
              <motion.div variants={{ hover: { scale: 1.3, background: isDarkMode ? "rgba(91,108,253,0.2)" : "#f0f3ff" } }} className="balloon-bg" />
              <div className="cat-content">
                <h3 className="cat-title" style={{fontWeight: 950, fontSize: '32px', marginBottom: '15px'}}>{cat.title}</h3>
                <div>{cat.pills.map((pill, pIdx) => (<span key={pIdx} className="pill">{pill}</span>))}</div>
                <div style={{fontWeight: '800', marginTop: '25px', display: 'flex', alignItems:'center', gap: '8px', color: theme.text}}>
                   Explore Category <span>➔</span>
                </div>
              </div>
              <motion.img variants={{ hover: { scale: 1.2, rotate: -15, y: -12 } }} src={cat.icon} className="cat-icon" alt="icon" />
            </motion.div>
          ))}
        </div>
      </div>

      <footer style={{padding:'50px 20px', textAlign:'center', background: isDarkMode ? '#0f172a' : '#1c252e', color:'white', borderTop: `1px solid ${theme.border}`}}>
        <p style={{opacity: 0.5, fontSize: '15px'}}>© 2026 StudyHub | Made for future doctors | By Bhaswar Ray</p>
      </footer>
    </>
  )
}