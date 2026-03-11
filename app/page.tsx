'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const { data: session } = useSession();
  const [customName, setCustomName] = useState("");

  // This effect checks if the user has saved a custom name in their browser
  useEffect(() => {
    const savedName = localStorage.getItem("userFirstName");
    if (savedName) setCustomName(savedName);
  }, []);

  // Priority: 1. Custom Name, 2. Google First Name, 3. "Student"
  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* RESET & GLOBAL */
        * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
        body { background:#f5f7fb; overflow-x: hidden; }

        /* HEADER & NAVIGATION */
        header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:15px 5%;
          background:white;
          box-shadow:0 2px 10px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .logo { font-weight:bold; font-size:24px; color:#6c63ff; text-decoration:none; }

        nav ul { display:flex; gap:25px; list-style:none; align-items:center; }
        nav ul li { cursor: pointer; color: #444; font-weight: 500; font-size: 15px; }

        /* MEGA MENU LOGIC */
        .mega-wrapper { position:relative; padding-bottom:15px; margin-bottom: -15px; }
        
        .all-courses-btn {
          border:2px solid #6c63ff;
          padding:8px 16px;
          border-radius:12px;
          color:#6c63ff;
          font-weight:600;
          display:flex;
          align-items:center;
          gap:8px;
        }

        .arrow {
          width:0; height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid #6c63ff;
          transition:0.3s;
        }
        .mega-wrapper:hover .arrow { transform:rotate(180deg); }

        .mega-menu {
          position:absolute;
          top:100%;
          left:0;
          width: 800px;
          background:white;
          border-radius:12px;
          box-shadow:0 15px 40px rgba(0,0,0,0.2);
          display:none;
          overflow:hidden;
        }
        .mega-wrapper:hover .mega-menu { display:block; }

        .mega-container { display:flex; }
        .mega-left { width:35%; background:#f8f9fa; padding:20px; }
        .mega-left div { padding:10px; border-radius:8px; margin-bottom:5px; cursor:pointer; }
        .mega-left div:hover { background:white; color:#6c63ff; }

        .mega-right { width:65%; padding:20px; display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        .course-item {
          background:#fafafa;
          padding:12px;
          border-radius:8px;
          font-weight:600;
          text-decoration:none;
          color:#333;
          text-align:center;
          border: 1px solid #eee;
        }
        .course-item:hover { background:#6c63ff; color:white; }

        /* HERO SECTION */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 8%;
          background: linear-gradient(135deg,#6a1b9a,#ff4ecd);
          border-radius: 0 0 40px 40px;
          color: white;
        }
        .hero-text { flex: 1; }
        .hero h1 { font-size: clamp(30px, 5vw, 48px); line-height: 1.2; }
        .hero p { margin-top: 20px; font-size: 18px; opacity: 0.9; }
        .hero button {
          margin-top: 30px;
          padding: 15px 35px;
          border: none;
          border-radius: 8px;
          background: white;
          color: #6a1b9a;
          font-weight: bold;
          cursor: pointer;
        }
        .hero img { width: clamp(200px, 30vw, 400px); transform: rotate(-5deg); }

        /* CARDS */
        .section { padding: 60px 5%; text-align: center; }
        .courses-grid { display: flex; justify-content: center; flex-wrap: wrap; gap: 25px; margin-top: 40px; }
        .card { background: white; padding: 30px; width: 280px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
        .card h3 { color: #6a1b9a; margin-bottom: 10px; }
        .card-btn { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #6c63ff; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; }

        /* AUTH UI */
        .auth-btns { display: flex; align-items: center; gap: 15px; }
        .login-btn { background:#6c63ff; color:white; padding:10px 20px; border-radius:8px; cursor:pointer; border:none; font-weight:600; }

        /* MOBILE RESPONSIVE */
        @media (max-width: 900px) {
          nav ul li:not(.mega-wrapper) { display: none; }
          .mega-menu { width: 90vw; left: -10px; }
          .hero { flex-direction: column; text-align: center; }
          .hero img { margin-top: 30px; width: 70%; }
        }
      ` }} />

      <header>
        <Link href="/" className="logo">StudyHub</Link>
        <nav>
          <ul>
            <li className="mega-wrapper">
              <div className="all-courses-btn">
                All Courses <div className="arrow"></div>
              </div>
              <div className="mega-menu">
                <div className="mega-container">
                  <div className="mega-left">
                    <div><b>Competitive Exams</b><br/><small>JEE, NEET, GATE</small></div>
                    <div><b>School Preparation</b><br/><small>Class 9-12</small></div>
                  </div>
                  <div className="mega-right">
                    <Link href="/neet" className="course-item">NEET</Link>
                    <Link href="#" className="course-item">IIT JEE</Link>
                    <Link href="#" className="course-item">Class 12</Link>
                    <Link href="#" className="course-item">Class 11</Link>
                  </div>
                </div>
              </div>
            </li>
            <li>Books</li>
            <li>Results</li>
          </ul>
        </nav>

        <div className="auth-btns">
          {session ? (
            <>
              <Link href="/profile" style={{fontWeight:'bold', color:'#6c63ff', textDecoration:'none'}}>
                Hi, {displayName}
              </Link>
              <button className="login-btn" style={{background:'#ff4757'}} onClick={() => signOut()}>Logout</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => signIn('google')}>Login / Register</button>
          )}
        </div>
      </header>

      <div className="hero">
        <div className="hero-text">
          <h1>{session ? `Welcome back, ${displayName}!` : "Crack NEET, JEE & Boards"}</h1>
          <p>Free notes, MCQs, mock tests and revision for Class 11 & 12 students.</p>
          <button onClick={() => session ? window.location.href='/neet' : signIn('google')}>
            {session ? "Go to My Courses" : "Start Learning"}
          </button>
        </div>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="Hero" />
      </div>

      <div className="section">
        <h2>Popular Courses</h2>
        <div className="courses-grid">
          <div className="card">
            <h3>Class 11</h3>
            <p>Physics, Chemistry, Biology & Maths</p>
            <Link href="#" className="card-btn">Explore</Link>
          </div>
          <div className="card">
            <h3>Class 12</h3>
            <p>Boards + Competitive Prep</p>
            <Link href="#" className="card-btn">Explore</Link>
          </div>
          <div className="card">
            <h3>NEET</h3>
            <p>MCQs, PYQs and Mock Tests</p>
            <Link href="/neet" className="card-btn">Explore</Link>
          </div>
        </div>
      </div>

      <footer style={{padding:'25px', textAlign:'center', background:'#6a1b9a', color:'white'}}>
        © 2026 StudyHub | Free Education Platform | Made by Bhaswar Ray
      </footer>
    </>
  )
}
