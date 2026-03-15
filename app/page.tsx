'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomePage() {
  const { data: session } = useSession();
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
  }, []);

  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  const handleStartLearning = () => {
    if (!session) {
      signIn('google');
    } else {
      examSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categories = [
    { 
      id: "Competitive", 
      title: "Exams", 
      sub: "NEET, JEE, GATE", 
      items: [
        { name: "NEET Preparation", href: "/neet" },
        { name: "IIT JEE Mains & Adv", href: "#" }
      ] 
    },
    { 
      id: "School", 
      title: "School Prep", 
      sub: "Classes 11 & 12", 
      items: [
        { name: "Class 11", href: "#" },
        { name: "Class 12", href: "#" }
      ] 
    },
  ];

  const examCategories = [
    {
      title: "NEET",
      pills: ["class 11", "class 12", "Dropper"],
      href: "/neet",
      icon: "https://cdn-icons-png.flaticon.com/512/3063/3063200.png"
    },
    {
      title: "IIT JEE",
      pills: ["class 11", "class 12", "Dropper"],
      href: "#",
      icon: "https://cdn-icons-png.flaticon.com/512/4341/4341139.png"
    },
    {
      title: "School Boards",
      pills: ["CBSE", "ICSE", "State Boards"],
      href: "#",
      icon: "https://cdn-icons-png.flaticon.com/512/2941/2941513.png"
    }
  ];

  const sketchElements = [
    { type: 'text', content: "ax² + bx + c = 0", top: "10%", left: "5%", rotate: -10, size: '32px' },
    { type: 'text', content: "E = mc²", top: "75%", left: "75%", rotate: 12, size: '40px' },
    { type: 'text', content: "sin θ", top: "8%", left: "70%", rotate: 8, size: '30px' },
    { type: 'text', content: "Σ xᵢ", top: "65%", left: "10%", rotate: -8, size: '36px' },
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/1048/1048951.png", top: "45%", left: "82%", rotate: 15, size: '90px' }, // DNA
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/3022/3022240.png", top: "25%", left: "42%", rotate: -5, size: '80px' }, // Microscope
    { type: 'img', src: "https://cdn-icons-png.flaticon.com/512/806/806653.png", top: "82%", left: "38%", rotate: -15, size: '70px' }, // Globe
    { type: 'pencil', content: "✏️", top: "22%", left: "18%", rotate: 45, size: '50px' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Inter', sans-serif; }
        body { background:#fcfdfe; overflow-x: hidden; scroll-behavior: smooth; }

        header {
          display:flex; align-items:center; justify-content:space-between;
          padding:15px 5%; background:rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px); box-shadow:0 2px 15px rgba(0,0,0,0.05);
          position: sticky; top: 0; z-index: 1000;
        }

        .logo { font-weight:900; font-size:26px; color:#5b6cfd; text-decoration:none; letter-spacing: -1px; }
        nav ul { display:flex; gap:25px; list-style:none; align-items:center; }
        
        .mega-wrapper { position:relative; padding-bottom:15px; margin-bottom: -15px; }
        .all-courses-btn { border:2.5px solid #5b6cfd; padding:10px 20px; border-radius:14px; color:#5b6cfd; font-weight:800; display:flex; align-items:center; gap:8px; cursor: pointer; }
        
        .mega-menu { 
          position:absolute; top:100%; left:0; width: 680px; background:white; 
          border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.12); 
          overflow:hidden; z-index: 2000; border: 1px solid #f0f0f0;
        }
        
        .mega-container { display:flex; height: 380px; }
        .mega-left { width:42%; background:#f8faff; padding:25px; border-right: 1px solid #f0f4ff; }
        .mega-left div { padding:18px; border-radius:15px; margin-bottom:10px; cursor:pointer; transition: 0.3s; }
        .mega-right { width:58%; padding:30px; display:grid; grid-template-columns: 1fr; gap:14px; overflow-y: auto; }
        
        .course-item { padding:16px; border-radius:15px; font-weight:800; text-decoration:none; color:#333; border: 1px solid #eee; transition: 0.2s; text-align: center; }
        .course-item:hover { background:#5b6cfd; color:white; border-color: #5b6cfd; transform: scale(1.02); }

        .hero { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 140px 10% 180px; background: linear-gradient(135deg, #4c1d95, #db2777, #3b82f6); 
          background-size: 400% 400%; animation: gradientShift 10s ease infinite;
          border-radius: 0 0 100px 100px; color: white; position: relative; overflow: hidden;
        }

        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .sketch-item { position: absolute; font-family: 'Comic Sans MS', cursive; color: rgba(255,255,255,0.25); pointer-events: none; z-index: 1; font-weight: 900; }

        .section { padding: 120px 8%; text-align: center; }
        .section-title { font-size: 45px; font-weight: 900; color: #1c252e; margin-bottom: 60px; letter-spacing: -1px;}
        
        .cat-card { 
            background: white; border-radius: 32px; padding: 45px; 
            text-align: left; position: relative; overflow: hidden; 
            border: 1px solid #f0f0f0; box-shadow: 0 12px 40px rgba(0,0,0,0.04); 
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer;
        }
        .cat-card:hover { transform: translateY(-15px); border-color: #5b6cfd; box-shadow: 0 25px 50px rgba(91, 108, 253, 0.15); }
        .cat-card::after {
            content: ""; position: absolute; top: 5%; right: -12%;
            width: 200px; height: 200px; background: #fff1f5;
            border-radius: 50%; z-index: 0; transition: 0.4s ease;
        }
        .cat-card:hover::after { background: #eef2ff; transform: scale(1.25); }

        .pill { padding: 10px 22px; border: 1px solid #edf2f7; border-radius: 50px; font-size: 14px; font-weight: 800; color: #4a5568; background: #f7fafc; margin-right: 10px; margin-bottom: 10px; display: inline-block; }
        
        .cat-icon { position: absolute; right: 30px; bottom: 50px; width: 95px; height: 95px; z-index: 1; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .cat-card:hover .cat-icon { transform: scale(1.2) rotate(-15deg) translateY(-10px); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.1)); }

        .hero-glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.2); max-width: 600px; z-index: 10; }
        .login-btn { background:#5b6cfd; color:white; padding:12px 28px; border-radius:15px; cursor:pointer; border:none; font-weight:800; box-shadow: 0 4px 15px rgba(91, 108, 253, 0.3); }
        .logout-btn { background:rgba(255, 71, 87, 0.1); color:#ff4757; padding:10px 20px; border-radius:12px; cursor:pointer; border:2px solid #ff4757; font-weight:800; }
      ` }} />

      <header>
        <Link href="/" className="logo">StudyHub</Link>
        <nav>
          <ul>
            <li className="mega-wrapper" onMouseEnter={() => setShowMegaMenu(true)} onMouseLeave={() => setShowMegaMenu(false)}>
              <div className="all-courses-btn">All Courses <motion.div animate={{ rotate: showMegaMenu ? 180 : 0 }} style={{width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'6px solid #5b6cfd'}}></motion.div></div>
              <AnimatePresence>
                {showMegaMenu && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mega-menu">
                    <div className="mega-container">
                      <div className="mega-left">
                        {categories.map(cat => (
                          <div key={cat.id} onMouseEnter={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? 'white' : 'transparent', color: activeCategory === cat.id ? '#5b6cfd' : '#444', boxShadow: activeCategory === cat.id ? '0 10px 25px rgba(0,0,0,0.06)' : 'none' }}>
                            <b style={{fontSize: '16px'}}>{cat.title}</b><br/><small style={{opacity: 0.6}}>{cat.sub}</small>
                          </div>
                        ))}
                      </div>
                      <div className="mega-right">
                        {categories.find(c => c.id === activeCategory)?.items.map(item => (
                          <Link href={item.href} key={item.name} className="course-item">{item.name}</Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
            {isOwner && <li><Link href="/neet" style={{color: '#5b6cfd', fontWeight: '900', textDecoration: 'none'}}>Live Dashboard</Link></li>}
            <li><b style={{color: '#444', fontSize:'15px'}}>Books</b></li>
            <li><b style={{color: '#444', fontSize:'15px'}}>Results</b></li>
          </ul>
        </nav>

        <div className="auth-btns">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <Link href="/profile" className="profile-link-area" style={{display:'flex', alignItems:'center', gap:'12px', textDecoration:'none'}}>
                <img src={profilePic || session.user?.image || ""} style={{width:'46px', height:'46px', borderRadius:'50%', border:'3px solid #5b6cfd', objectFit: 'cover'}} />
                <div style={{display:'flex', flexDirection:'column'}}>
                  <span style={{fontWeight:'900', fontSize:'16px', color: '#1c252e'}}>Hi, {displayName}</span>
                  <span style={{fontSize:'11px', fontWeight:'900', color:'#5b6cfd'}}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
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
        {sketchElements.map((el, i) => (
          <motion.div
            key={i}
            className="sketch-item"
            style={{ top: el.top, left: el.left, rotate: el.rotate, fontSize: el.size }}
            animate={{ y: [0, -25, 0], rotate: [el.rotate, el.rotate + 10, el.rotate] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {el.type === 'img' ? <img src={el.src} style={{width: el.size, opacity: 0.3}} /> : el.content}
          </motion.div>
        ))}

        <div className="hero-glass">
          <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {session ? `Welcome back, ${displayName}!` : "Crack NEET, JEE & Boards"}
          </motion.h1>
          <p>Hand-crafted platform for the thinkers of tomorrow. Dive into premium notes, interactive classes, and expert guidance.</p>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="hero-btn" onClick={handleStartLearning} style={{marginTop:'10px'}}>
            {session ? "Start Learning Now" : "Join StudyHub Today"}
          </motion.button>
        </div>
        
        <motion.img animate={{ y: [0, -30, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="Hero" 
          style={{width:'460px', position: 'relative', zIndex: 6, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.2))'}} 
        />
      </div>

      <div className="section" id="categories" ref={examSectionRef}>
        <h2 className="section-title">Exam Categories</h2>
        <div className="category-grid">
          {examCategories.map((cat, idx) => (
            <motion.div whileHover={{ scale: 1.02 }} key={idx} className="cat-card" onClick={() => window.location.href = cat.href}>
              <div className="cat-content">
                <h3 className="cat-title">{cat.title}</h3>
                <div>{cat.pills.map((pill, pIdx) => (<span key={pIdx} className="pill">{pill}</span>))}</div>
                <div style={{fontWeight:'900', color:'#1c252e', marginTop:'20px', display:'flex', alignItems:'center', gap:'10px'}}>Explore Category <span>➔</span></div>
              </div>
              <img src={cat.icon} className="cat-icon" alt="icon" />
            </motion.div>
          ))}
        </div>
      </div>

      <footer style={{padding:'60px 20px', textAlign:'center', background:'#111', color:'white'}}>
        <p style={{opacity: 0.5, fontSize: '15px', fontWeight: '600', letterSpacing:'1px'}}>© 2026 STUDYHUB | FACULTY: BHASWAR RAY | MADE FOR FUTURE DOCTORS</p>
      </footer>
    </>
  )
}