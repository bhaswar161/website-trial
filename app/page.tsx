'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { data: session } = useSession();
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");
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
      // Smooth scroll to categories section
      examSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
        body { background:#fcfdfe; overflow-x: hidden; }

        header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:15px 5%;
          background:white;
          box-shadow:0 2px 15px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .logo { font-weight:900; font-size:24px; color:#5b6cfd; text-decoration:none; letter-spacing: -0.5px; }
        nav ul { display:flex; gap:25px; list-style:none; align-items:center; }
        nav ul li { cursor: pointer; color: #444; font-weight: 600; font-size: 15px; }

        /* MEGA MENU */
        .mega-wrapper { position:relative; padding-bottom:15px; margin-bottom: -15px; }
        .all-courses-btn { border:2px solid #5b6cfd; padding:8px 18px; border-radius:12px; color:#5b6cfd; font-weight:700; display:flex; align-items:center; gap:8px; }
        .arrow { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #5b6cfd; transition:0.3s; }
        .mega-wrapper:hover .arrow { transform:rotate(180deg); }
        .mega-menu { position:absolute; top:100%; left:0; width: 600px; background:white; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.1); display:none; overflow:hidden; }
        .mega-wrapper:hover .mega-menu { display:block; }
        .mega-container { display:flex; }
        .mega-left { width:40%; background:#f8f9fa; padding:20px; }
        .mega-right { width:60%; padding:20px; display:grid; grid-template-columns: 1fr; gap:10px; }
        .course-item { padding:12px; border-radius:10px; font-weight:700; text-decoration:none; color:#333; border: 1px solid #eee; }
        .course-item:hover { background:#f4f6ff; color:#5b6cfd; border-color: #5b6cfd; }

        /* HERO IMPROVED WITH DYNAMIC COLOR */
        .hero { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 100px 10% 140px; 
          background: linear-gradient(135deg, #6a1b9a, #ff4ecd, #5b6cfd); 
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          border-radius: 0 0 80px 80px; 
          color: white; 
          position: relative;
          overflow: hidden;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .floating-blob {
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(255,255,255,0.1);
          filter: blur(40px);
          border-radius: 50%;
          z-index: 1;
        }

        .hero h1 { font-size: 52px; font-weight: 900; line-height: 1.1; position: relative; z-index: 2; }
        .hero p { margin: 20px 0 30px; font-size: 18px; opacity: 0.9; position: relative; z-index: 2; }
        .hero-btn { 
          padding: 16px 40px; 
          border: none; 
          border-radius: 14px; 
          background: white; 
          color: #6a1b9a; 
          font-weight: 900; 
          cursor: pointer; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
          transition: 0.3s;
          position: relative;
          z-index: 2;
        }
        .hero-btn:hover { transform: scale(1.05); background: #f8f8f8; }

        /* EXAM CATEGORIES SECTION */
        .section { padding: 80px 8% 100px; text-align: center; }
        .section-title { font-size: 36px; font-weight: 900; color: #1c252e; margin-bottom: 15px; }
        .section-sub { color: #666; font-size: 16px; margin-bottom: 50px; max-width: 600px; margin-left: auto; margin-right: auto; }

        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }
        
        .cat-card { 
            background: white; 
            border-radius: 24px; 
            padding: 35px; 
            text-align: left; 
            position: relative; 
            overflow: hidden; 
            border: 1px solid #f0f0f0; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
        }
        
        .cat-card:hover { transform: translateY(-10px); border-color: #5b6cfd; }

        .cat-card::after {
            content: "";
            position: absolute;
            top: 5%;
            right: -10%;
            width: 160px;
            height: 160px;
            background: #fff5f8;
            border-radius: 50%;
            z-index: 0;
            transition: 0.4s ease;
        }
        .cat-card:hover::after { background: #f4f6ff; transform: scale(1.2); }

        .cat-content { position: relative; z-index: 2; }
        .cat-title { font-size: 24px; font-weight: 900; color: #1c252e; margin-bottom: 20px; }
        
        .pill-group { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px; }
        .pill { 
            padding: 8px 16px; 
            border: 1px solid #eee; 
            border-radius: 50px; 
            font-size: 13px; 
            font-weight: 600; 
            color: #666; 
            background: #fafafa;
        }

        .explore-link { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            text-decoration: none; 
            color: #1c252e; 
            font-weight: 800; 
            font-size: 15px; 
        }

        /* HOVER ICON ANIMATION */
        .cat-icon {
            position: absolute;
            right: 20px;
            bottom: 40px;
            width: 80px;
            height: 80px;
            z-index: 1;
            transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .cat-card:hover .cat-icon {
            transform: scale(1.1) rotate(-15deg) translateY(-10px);
            filter: drop-shadow(0 15px 20px rgba(91, 108, 253, 0.2));
        }

        .login-btn { background:#5b6cfd; color:white; padding:10px 22px; border-radius:12px; cursor:pointer; border:none; font-weight:700; }
        .logout-btn { background:#ff4757; color:white; padding:10px 20px; border-radius:10px; cursor:pointer; border:none; font-weight:700; }
        
        .profile-link-area { display: flex; alignItems: center; gap: 10px; cursor: pointer; text-decoration: none; color: inherit; }
      ` }} />

      <header>
        <Link href="/" className="logo">StudyHub</Link>
        <nav>
          <ul>
            <li className="mega-wrapper">
              <div className="all-courses-btn">All Courses <div className="arrow"></div></div>
              <div className="mega-menu">
                <div className="mega-container">
                  <div className="mega-left">
                    <div><b>Exams</b></div>
                    <div style={{color: '#5b6cfd'}}>Medical & Engineering</div>
                  </div>
                  <div className="mega-right">
                    <Link href="/neet" className="course-item">NEET Preparation</Link>
                    <Link href="#" className="course-item">IIT JEE Mains & Adv</Link>
                  </div>
                </div>
              </div>
            </li>
            {isOwner && <li><Link href="/neet" style={{color: '#5b6cfd', fontWeight: '800', textDecoration: 'none'}}>Live Dashboard</Link></li>}
            <li>Books</li>
            <li>Results</li>
          </ul>
        </nav>

        <div className="auth-btns" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {session ? (
            <>
              {/* CLICK NAME OR PIC TO GO TO PROFILE */}
              <Link href="/profile" className="profile-link-area" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={profilePic || session.user?.image || ""} style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #5b6cfd'}} />
                <div style={{display:'flex', flexDirection:'column'}}>
                  <span style={{fontWeight:'800', fontSize:'14px', color: '#1c252e'}}>Hi, {displayName}</span>
                  <span style={{fontSize:'10px', fontWeight:'900', color:'#5b6cfd'}}>{isOwner ? 'FACULTY' : 'STUDENT'}</span>
                </div>
              </Link>
              <button className="logout-btn" onClick={() => signOut()}>Logout</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => signIn('google')}>Login / Register</button>
          )}
        </div>
      </header>

      {/* HERO SECTION WITH ANIMATED BLOBS & DYNAMIC COLOR */}
      <div className="hero">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }} 
          transition={{ duration: 8, repeat: Infinity }} 
          className="floating-blob" style={{top: '10%', right: '15%'}} 
        />
        <div className="hero-text">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {session ? `Welcome back, ${displayName}!` : "Crack NEET, JEE & Boards"}
          </motion.h1>
          <p>The platform is built for the future of students so that they can get a guide in their ambitious path. Get premium revision notes, interactive mock tests, and faculty guidance.</p>
          {/* SMART BUTTON LOGIC */}
          <button className="hero-btn" onClick={handleStartLearning}>
            {session ? "Start Learning Now" : "Join StudyHub Now"}
          </button>
        </div>
        
        <motion.img 
          animate={{ y: [0, -20, 0] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" 
          alt="Hero" 
          style={{width:'420px', position: 'relative', zIndex: 2}} 
        />
      </div>

      {/* ADDED ID FOR SMOOTH SCROLL */}
      <div className="section" id="categories" ref={examSectionRef}>
        <h2 className="section-title">Exam Categories</h2>
        <p className="section-sub">We prepare students for 35+ categories. Find the one you are preparing for.</p>
        
        <div className="category-grid">
          {examCategories.map((cat, idx) => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              key={idx} 
              className="cat-card" 
              onClick={() => window.location.href = cat.href}
            >
              <div className="cat-content">
                <h3 className="cat-title">{cat.title}</h3>
                <div className="pill-group">
                  {cat.pills.map((pill, pIdx) => (
                    <span key={pIdx} className="pill">{pill}</span>
                  ))}
                </div>
                <div className="explore-link">
                  Explore Category <span>➔</span>
                </div>
              </div>
              <img src={cat.icon} className="cat-icon" alt="icon" />
            </motion.div>
          ))}
        </div>
      </div>

      <footer style={{padding:'40px', textAlign:'center', background:'#1c252e', color:'white'}}>
        <p style={{opacity: 0.6, fontSize: '14px'}}>© 2026 StudyHub | Made for students | Made by Bhaswar Ray</p>
      </footer>
    </>
  )
}