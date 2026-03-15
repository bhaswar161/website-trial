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

  const categories = [
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
      sub: "Board Excellence", 
      items: [
        { name: "Class 11 Boards", href: "#" },
        { name: "Class 12 Boards", href: "#" }
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
        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
        body { background:#fcfdfe; overflow-x: hidden; scroll-behavior: smooth; }

        header {
          display:flex; align-items:center; justify-content:space-between;
          padding:15px 5%; background:rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05);
          position: sticky; top: 0; z-index: 1000; height: 80px;
        }

        .logo { font-weight:900; font-size:24px; color:#5b6cfd; text-decoration:none; letter-spacing: -0.8px; }

        .all-courses-btn { border:2px solid #5b6cfd; padding:8px 16px; border-radius:12px; color:#5b6cfd; font-weight:700; display:flex; align-items:center; gap:8px; cursor: pointer; }
        
        .mega-menu { 
          position:absolute; top:70px; left:0; width: 550px; background:white; 
          border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.12); 
          overflow:hidden; z-index: 2000; border: 1px solid #f0f0f0;
        }
        
        .mega-container { display:flex; height: 320px; }
        .mega-left { width:40%; background:#f9fafb; padding:20px; border-right: 1px solid #f1f1f1; }
        .mega-left div { padding:12px; border-radius:12px; margin-bottom:8px; cursor:pointer; }
        .mega-right { width:60%; padding:20px; display:grid; grid-template-columns: 1fr; gap:10px; }
        
        .course-item { padding:12px; border-radius:12px; font-weight:700; text-decoration:none; color:#1c252e; border: 1px solid #f0f0f0; text-align: center; background: #fff; }
        .course-item:hover { background:#5b6cfd; color:#fff; border-color: #5b6cfd; }

        .hero { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 120px 10% 160px; background: linear-gradient(135deg, #6a1b9a, #ff4ecd, #5b6cfd); 
          background-size: 400% 400%; animation: gradientShift 10s ease infinite;
          border-radius: 0 0 100px 100px; color: white; position: relative; overflow: hidden;
        }

        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .sketch-asset { position: absolute; pointer-events: none; z-index: 1; opacity: 0.35; filter: brightness(0) invert(1); }
        .sketch-text-asset { position: absolute; font-family: 'Comic Sans MS', cursive; color: white; opacity: 0.25; font-weight: bold; pointer-events: none; z-index: 1; }

        .hero h1 { font-size: clamp(32px, 5vw, 58px); font-weight: 900; line-height: 1.1; position: relative; z-index: 10; margin-bottom: 20px; }
        .hero-btn { padding: 18px 45px; border: none; border-radius: 16px; background: white; color: #6a1b9a; font-weight: 900; font-size: 18px; cursor: pointer; box-shadow: 0 15px 30px rgba(0,0,0,0.2); position: relative; z-index: 10; }

        .section { padding: 100px 8%; text-align: center; }
        .section-title { font-size: 36px; font-weight: 900; color: #1c252e; margin-bottom: 60px; }
        
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 40px; }
        
        .cat-card { 
            background: white; border-radius: 32px; padding: 45px; 
            text-align: left; position: relative; overflow: hidden; 
            border: 1px solid #f0f0f0; box-shadow: 0 15px 45px rgba(0,0,0,0.04); 
            transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer;
        }
        .cat-card:hover { transform: translateY(-15px); border-color: #5b6cfd; }
        .cat-card::after { content: ""; position: absolute; top: 0; right: -15%; width: 200px; height: 200px; background: #fff1f5; border-radius: 50%; z-index: 0; }

        .pill { padding: 8px 18px; border: 1px solid #eee; border-radius: 50px; font-size: 13px; font-weight: 700; color: #5b6cfd; background: #f4f6ff; margin: 0 10px 10px 0; display: inline-block; }
        .cat-icon { position: absolute; right: 30px; bottom: 50px; width: 95px; height: 95px; z-index: 1; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

        .profile-link-area { display: flex; align-items: center; gap: 12px; cursor: pointer; text-decoration: none; color: inherit; }
        .logout-btn { background:#ff4757; color:white; padding:10px 20px; border-radius:10px; cursor:pointer; border:none; font-weight:700; }
        .login-btn { background:#5b6cfd; color:white; padding:12px 24px; border-radius:14px; cursor:pointer; border:none; font-weight:700; }

        /* RESPONSIVE DESIGN */
        @media (max-width: 1024px) {
          header nav { display: none; }
          .hero { flex-direction: column; text-align: center; padding: 100px 5% 80px; }
          .hero img { width: 300px !important; margin-top: 40px; }
          .hero-text { margin: 0 auto; }
        }
        @media (max-width: 600px) {
          .section { padding: 60px 5%; }
          .category-grid { grid-template-columns: 1fr; }
          .mega-menu { width: 90vw; left: 5vw; }
        }
      ` }} />

      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <Link href="/" className="logo">StudyHub</Link>
          <nav>
            <ul style={{ display: 'flex', gap: '25px', listStyle: 'none', alignItems: 'center' }}>
              <li className="mega-wrapper" onMouseEnter={() => setShowMegaMenu(true)} onMouseLeave={() => setShowMegaMenu(false)}>
                <div className="all-courses-btn">All Courses <motion.div animate={{ rotate: showMegaMenu ? 180 : 0 }} style={{width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'6px solid #5b6cfd'}}></motion.div></div>
                <AnimatePresence>
                  {showMegaMenu && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mega-menu">
                      <div className="mega-container">
                        <div className="mega-left">
                          {categories.map(cat => (
                            <div key={cat.id} onMouseEnter={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? 'white' : 'transparent', color: activeCategory === cat.id ? '#5b6cfd' : '#444', boxShadow: activeCategory === cat.id ? '0 10px 20px rgba(0,0,0,0.04)' : 'none' }}>
                              <b style={{fontSize: '15px'}}>{cat.title}</b><br/><small style={{opacity: 0.6}}>{cat.sub}</small>
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
              {isOwner && <li><Link href="/neet" style={{color: '#5b6cfd', fontWeight: '800', textDecoration: 'none'}}>Dashboard</Link></li>}
              <li style={{fontWeight: 600, color: '#444'}}>Books</li>
              <li style={{fontWeight: 600, color: '#444'}}>Results</li>
            </ul>
          </nav>
        </div>

        <div className="auth-btns">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/profile" className="profile-link-area">
                {/* PROFILE IMAGE BEFORE NAME */}
                <img src={profilePic || session.user?.image || ""} style={{width:'45px', height:'45px', borderRadius:'50%', border:'2.5px solid #5b6cfd', objectFit: 'cover'}} />
                <div style={{textAlign: 'left'}}>
                   <div style={{fontWeight:'800', fontSize:'15px', color: '#1c252e'}}>Hi, {displayName}</div>
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
          <motion.div
            key={i}
            className={el.type === 'text' ? 'sketch-text-asset' : 'sketch-asset'}
            style={{ top: el.top, left: el.left, fontSize: el.size || '24px', width: el.type === 'img' ? el.size : 'auto' }}
            animate={{ y: [0, -30, 0], rotate: [0, 12, -12, 0], opacity: el.type === 'text' ? [0.2, 0.4, 0.2] : [0.3, 0.6, 0.3] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {el.type === 'img' ? <img src={el.src} style={{width: '100%'}} alt="science" /> : el.content}
          </motion.div>
        ))}

        <div className="hero-text" style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
          <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            {session ? `Welcome back, ${displayName}!` : "Crack NEET, JEE & Boards"}
          </motion.h1>
          <p style={{fontSize: '18px', lineHeight: '1.6'}}>Master complex concepts with premium notes and daily interactive classes from top faculty.</p>
          <button className="hero-btn" onClick={handleStartLearning}>
            {session ? "Start Learning Now" : "Join StudyHub Today"}
          </button>
        </div>
        <motion.img animate={{ y: [0, -25, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" style={{width:'440px', position: 'relative', zIndex: 6}} />
      </div>

      <div className="section" id="categories" ref={examSectionRef}>
        <h2 className="section-title">Explore Your Path</h2>
        <div className="category-grid">
          {examCategories.map((cat, idx) => (
            <motion.div whileHover={{ scale: 1.02 }} key={idx} className="cat-card" onClick={() => window.location.href = cat.href}>
              <div className="cat-content">
                <h3 className="cat-title">{cat.title}</h3>
                <div>{cat.pills.map((pill, pIdx) => (<span key={pIdx} className="pill">{pill}</span>))}</div>
                <div style={{fontWeight: '800', marginTop: '20px', display: 'flex', alignItems:'center', gap: '8px', color: '#1c252e'}}>Explore Category ➔</div>
              </div>
              <img src={cat.icon} className="cat-icon" alt="icon" />
            </motion.div>
          ))}
        </div>
      </div>

      <footer style={{padding:'50px 20px', textAlign:'center', background:'#1c252e', color:'white'}}>
        <p style={{opacity: 0.5, fontSize: '15px'}}>© 2026 StudyHub | Made for future doctors | By Bhaswar Ray</p>
      </footer>
    </>
  )
}