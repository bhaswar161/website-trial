'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* GENERAL */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
        }

        body {
          background: #f5f7fb;
        }

        /* NAVBAR */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 60px;
          background: white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6a1b9a;
        }

        .nav-links {
          display: flex;
          align-items: center;
        }

        .nav-links a, .nav-links button {
          margin-left: 25px;
          text-decoration: none;
          color: #333;
          font-weight: 500;
          transition: 0.3s;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }

        .nav-links a:hover, .nav-links button:hover {
          color: #6a1b9a;
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: 25px;
          padding: 5px 12px;
          background: #f0e6f7;
          border-radius: 20px;
          color: #6a1b9a;
          font-weight: bold;
          font-size: 14px;
        }

        .user-pic {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #6a1b9a;
        }

        /* HERO */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 60px;
          background: linear-gradient(135deg,#6a1b9a,#ff4ecd);
          border-radius: 0 0 40px 40px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .hero h1 {
          font-size: 48px;
          line-height: 1.2;
        }

        .hero p {
          margin-top: 20px;
          font-size: 18px;
          opacity: 0.9;
        }

        .hero button {
          margin-top: 30px;
          padding: 15px 35px;
          border: none;
          border-radius: 8px;
          background: white;
          color: #6a1b9a;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
        }

        .hero button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .hero img {
          width: 400px;
          transform: rotate(-5deg);
        }

        .section {
          padding: 80px 40px;
          text-align: center;
        }

        .section h2 {
          font-size: 36px;
          margin-bottom: 50px;
        }

        .courses {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 30px;
        }

        .course-card {
          position: relative;
          background: white;
          padding: 35px;
          width: 260px;
          border-radius: 20px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
          transition: all 0.35s ease;
          overflow: hidden;
          animation: float 3s ease-in-out infinite alternate;
        }

        .course-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          height: 5px;
          width: 100%;
          background: linear-gradient(90deg,#6a1b9a,#ff4ecd);
        }

        .course-card:hover {
          transform: translateY(-15px) scale(1.05);
          box-shadow: 0 25px 50px rgba(0,0,0,0.18);
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }

        .course-card h3 {
          color: #6a1b9a;
          font-size: 22px;
          margin-bottom: 12px;
        }

        .course-card p {
          color: #555;
          font-size: 15px;
        }

        .course-card button, .btn {
          margin-top: 18px;
          display: inline-block;
          padding: 12px 25px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg,#6a1b9a,#9c27b0);
          color: white;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
          transition: 0.3s;
        }

        .course-card button:hover, .btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 20px rgba(106,27,154,0.4);
        }

        /* EXAM SECTION */
        .exam-section {
          padding: 80px 10%;
          background: #f5f6fa;
          text-align: center;
        }

        .exam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .exam-card {
          background: white;
          border-radius: 15px;
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transition: 0.3s;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .exam-card:hover {
          transform: translateY(-8px);
        }

        .exam-card img {
          width: 70px;
          transition: 0.5s ease;
        }

        .exam-card:hover img {
          transform: scale(1.2);
        }

        .tags span {
          border: 1px solid #ddd;
          padding: 6px 12px;
          border-radius: 20px;
          margin-right: 8px;
          font-size: 14px;
        }

        .explore {
          display: inline-block;
          margin-top: 10px;
          text-decoration: none;
          color: #7b2ff7;
          font-weight: bold;
        }

        footer {
          margin-top: 60px;
          padding: 25px;
          text-align: center;
          background: #6a1b9a;
          color: white;
          font-size: 16px;
        }
      ` }} />

      {/* NAVBAR */}
      <div className="navbar">
        <div className="logo">StudyHub</div>
        <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/neet">NEET</Link>
            
            {session ? (
              <>
                <div className="user-badge">
                  {session.user?.image && <img src={session.user.image} className="user-pic" alt="User" />}
                  <span>{session.user?.name?.split(' ')[0]}</span>
                </div>
                <button onClick={() => signOut()}>Logout</button>
              </>
            ) : (
              <button onClick={() => signIn('google')}>Login</button>
            )}
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div>
          <h1>{session ? `Welcome back, ${session.user?.name?.split(' ')[0]}!` : "Crack NEET, JEE & Boards"}</h1>
          <p>Free notes, MCQs, mock tests and revision for Class 11 & 12 students.</p>
          
          {session ? (
             <button onClick={() => window.location.href='/neet'}>Go to My Courses</button>
          ) : (
             <button onClick={() => signIn('google')}>Start Learning</button>
          )}
        </div>
        <img src="https://
