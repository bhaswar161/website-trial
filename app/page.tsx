'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../context/ThemeContext"

export default function HomePage() {
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Competitive");
  const examSectionRef = useRef<HTMLDivElement>(null);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  // Sync profile data from LocalStorage
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

  // Dynamic Theme Colors
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#fcfdfe',
    header: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#666',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    card: isDarkMode ? '#1e293b' : 'white',
    megaLeft: isDarkMode ? '#0f172a' : '#f9fafb'
  };

  const megaMenuData = [
    { 
      id: "Competitive", 
      title: "Exams", 
      sub: "NEET & JEE Prep", 
      items: [
        { name: "NEET Preparation", href: "/neet" },
        { name: "IIT JEE Mains & Adv", href: "#" }
      ] 
    },
    { 
      id: "School", 
      title: "School Prep", 
      sub: "Class 11 & 12 Boards", 
      items: [
        { name: "Class 11 Boards", href: "#" },
        { name: "Class 12 Boards", href: "#" }
      ] 
    },
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
        * { margin:0; padding:0; box-sizing:border-box; list-style: none; text-decoration: none; font-family: 'Segoe UI', sans-serif; }
        body { background:${theme.bg}; color: ${theme.text}; overflow-x: hidden; scroll-behavior: smooth; transition: background 0.4s ease; }

        header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 5%; background: ${theme.header}; backdrop-filter: blur(15px);
          border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 1000; height: 80px;
        }

        .logo { font-weight:900; font-size:26px; color:#5b6cfd; letter-spacing: -0.8px; }

        .nav-center ul { display: flex; align-items: center; gap: 30px; }
        .nav-center li { cursor: pointer; color: ${theme.text}; font-weight: 600; font-size: 15px; opacity: 0.8; transition: 0.2s; }
        .nav-center li:hover { opacity: 1; color: #5b6cfd; }

        .all-courses-btn { border:2px solid #5b6cfd; padding:8px 18px; border-radius:12px; color:#5b6cfd; font-weight:700; display:flex; align-items:center; gap:8px; cursor: pointer; }
        
        .mega-menu { 
          position:absolute; top:75px; left: 50%; transform: translateX(-50%); width: 550px; background:${isDarkMode ? '#1e293b' : 'white'}; 
          border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.25); z-index: 2000; border: 1px solid ${theme.border}; overflow: hidden;
        }
        
        .mega-container { display:flex; height: 320px; }
        .mega-left { width:40%; background:${theme.megaLeft}; padding:20px; border-right: 1px solid ${theme.border}; }
        .mega-left div { padding:14px; border-radius:12px; margin-bottom:8px; cursor:pointer; transition: 0.2s; }
        .mega-right { width:60%; padding:20px; display:grid; grid-template-columns: 1fr; gap:10px; overflow-y: auto; }
        .course-item { padding:12px; border-radius:12px; font-weight:700; color:${theme.text}; border: 1px solid ${theme.border}; text-align: center; background: ${isDarkMode ? '#0f172a' : '#fff'}; transition: 0.2s; }
        .course-item:hover { background:#5b6cfd; color:#fff; border-color: #5b6cfd; }

        .hero { 
          min-height: 85vh; display: flex; align-items: center; justify-content: center; 
          padding: 60px 10%; background: ${isDarkMode ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'linear-gradient(135deg, #6a1b9a, #ff4ecd, #5b6cfd)'}; 
          border-radius: 0 0 80px 80px; color: white; position: relative; overflow: hidden; text-align: center;
        }

        .sketch-asset { position: absolute; pointer-events: none; z-index: 1; opacity: 0.25; filter: brightness(0) invert(1); }
        .sketch-text-asset { position: absolute; font-family: 'Comic Sans MS', cursive; color: white; opacity: 0.15; font-weight: bold; pointer-events: none; z-index: 1; }

        .hero-content { position: relative; z-index: 10; max-width: 850px; }
        .hero h1 { font-size: clamp(38px, 6vw, 70px); font-weight: 950; line-height: 1.1; margin-bottom: 25px; letter-spacing: -2px; }
        .hero p { font-size: 20px; opacity: 0.9; margin-bottom: 40px; }
        .hero-btn { padding: 20px 50px; border: none; border-radius: 20px; background: white; color: #5b6cfd; font-weight: 950; font-size: 20px; cursor: pointer; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }

        .section { padding: 100px 10%; text-align: center; }
        .cat-card { background: ${theme.card}; border-radius: 35px; padding: 45px; text-align: left; position: relative; overflow: hidden; border: 1px solid ${theme.border}; transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .cat-card:hover { transform: translateY(-15px); border-color: #5b6cfd; box-shadow: 0 25px 60px rgba(91, 108, 253, 0.2); }
        .balloon-bg { position: absolute; top: 0; right: -15%; width: 220px; height: 220px; background: ${isDarkMode ? 'rgba(91,108,253,0.1)' : '#fff1f5'}; border-radius: 50%; z-index: 0; }
        .pill { padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; color: #5b6cfd; background: ${isDarkMode ? '#334155' : '#f4f6ff'}; margin: 0 8px 8px 0; display: inline-block; position: relative; z-index: 2; }

        .auth-section { display: flex; align-items: center; gap: 15px; }
        .theme-btn { background: ${isDarkMode ? '#334155' : '#f0f2ff'}; border: none; width: 45px; height: 45px; border-radius: 12px; cursor: pointer; font-size: 22px; display: flex; align-items: center; justify-content: center; }
        .profile-pill { display: flex; align-items: center; gap: 12px; background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}; padding: 6px 16px 6px 6px; border-radius: 50px; color: inherit; }
      `}} />

      <header>
        <Link href="/" className="logo">StudyHub</Link>

        <nav className="nav-center">
          <ul>
            <li onMouseEnter={() => setShowMegaMenu(true)} onMouseLeave={() => setShowMegaMenu(false)}>
              <div className="all-courses-btn">All Courses <motion.div animate={{ rotate: showMegaMenu ? 180 : 0 }} style={{width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'6px solid #5b6cfd'}}></motion.div></div>
              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mega-menu">
                    <div className="mega-container">
                      <div className="mega-left">
                        {megaMenuData.map(cat => (
                          <div key={cat.id} onMouseEnter={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? (isDarkMode ? '#334155' : 'white') : 'transparent', color: activeCategory === cat.id ? '#5b6cfd' : theme.text }}>
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
            {session && <li><Link href={isOwner ? "/admin" : "/neet"} style={{ color: isOwner ? '#ff4757' : '#5b6cfd', fontWeight: '800' }}>{isOwner ? 'Admin Panel' : 'Dashboard'}</Link></li>}
            <li>Books</li>
            <li>Results</li>
          </ul>
        </nav>

        <div className="auth-section">
          <button onClick={toggleTheme} className="theme-btn">{isDarkMode ? "☀️" : "🌙"}</button>
          {session ? (
            <>
              <Link href="/profile" className="profile-pill">
                <img src={profilePic || session.user?.image || ""} style={{width:'38px', height:'38px', borderRadius:'50%', objectFit: 'cover', border: '2px solid #5b6cfd'}} />
                <div style={{lineHeight: 1.1}}>
                   <div style={{fontWeight:'800', fontSize:'13px'}}>Hi, {displayName}</div>
                   <div style={{fontSize:'10px', color:'#5b6cfd', fontWeight:'900'}}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
                </div>
              </Link>
              <button onClick={() => signOut()} style={{background:'none', border:'none', color:'#ff4757', fontWeight:'700', cursor:'pointer', fontSize:'14px'}}>Logout</button>
            </>
          ) : (
            <button onClick={() => signIn('google')} style={{padding:'12px 25px', borderRadius:'14px', background:'#5b6cfd', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Login</button>
          )}
        </div>
      </header>

      <section className="hero">
        {floatingAssets.map((el, i) => (
          <motion.div key={i} className={el.type === 'text' ? 'sketch-text-asset' : 'sketch-asset'} style={{ top: el.top, left: el.left, fontSize: el.size || '24px', width: el.type === 'img' ? el.size : 'auto' }} animate={{ y: [0, -40, 0], rotate: [0, 10, -10, 0], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut" }}>
            {el.type === 'img' ? <img src={el.src} style={{width: '100%'}} /> : el.content}
          </motion.div>
        ))}
        <div className="hero-content">
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {session ? `Welcome back, ${displayName}!` : "Master Your Future"}
          </motion.h1>
          <p>Crack NEET, JEE & Boards with interactive classes and premium study material.</p>
          <motion.button whileHover={{ scale: 1.05 }} className="hero-btn" onClick={handleStartLearning}>Start Learning Now</motion.button>
        </div>
      </section>

      <div className="section" ref={examSectionRef}>
        <h2 style={{fontSize:'44px', fontWeight:950, marginBottom: '10px'}}>Explore Your Path</h2>
        <p style={{color: theme.subtext, marginBottom: '60px', fontSize: '18px'}}>Choose your goal and start your journey today.</p>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '35px'}}>
          {examCategories.map((cat, idx) => (
            <motion.div whileHover="hover" key={idx} className="cat-card" onClick={() => window.location.href = cat.href}>
              <div className="balloon-bg" />
              <div style={{position: 'relative', zIndex: 2}}>
                <h3 style={{fontWeight: 950, fontSize: '34px', marginBottom: '15px'}}>{cat.title}</h3>
                <div>{cat.pills.map(p => (<span key={p} className="pill">{p}</span>))}</div>
                <div style={{fontWeight: '800', marginTop: '30px', color: '#5b6cfd', display: 'flex', alignItems: 'center', gap: '8px'}}>Explore Category <span>➔</span></div>
              </div>
              <motion.img variants={{ hover: { scale: 1.15, rotate: -8, y: -5 } }} src={cat.icon} style={{position: 'absolute', right: '30px', bottom: '40px', width: '105px'}} />
            </motion.div>
          ))}
        </div>
      </div>

      <footer style={{padding:'60px 20px', textAlign:'center', background: isDarkMode ? '#0f172a' : '#1c252e', color:'white', borderTop: `1px solid ${theme.border}`}}>
        <p style={{opacity: 0.5}}>© 2026 StudyHub | Dedicated to NEET Aspirants | By Bhaswar Ray</p>
      </footer>
    </>
  )
}