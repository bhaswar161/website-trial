'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from 'next/link'

export default function NeetPage() {
  const { data: session, status } = useSession()

  // SECURITY CHECK: If not logged in, redirect to login page
  if (status === "unauthenticated") {
    redirect("/login")
  }

  // Show a loading screen while checking the Google account
  if (status === "loading") {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading StudyHub...</div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', sans-serif;
        }

        body {
          background: #f6f8ff;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 8%;
          background: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6c63ff;
        }

        nav a {
          margin-left: 25px;
          text-decoration: none;
          color: #444;
          font-weight: 500;
          transition: 0.3s;
        }

        nav a:hover {
          color: #6c63ff;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 8%;
          background: linear-gradient(135deg,#6c63ff,#8a7bff);
          color: white;
          flex-wrap: wrap;
        }

        .hero-text {
          max-width: 500px;
        }

        .hero-text h1 {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .hero-text p {
          font-size: 18px;
          margin-bottom: 25px;
          opacity: 0.9;
        }

        .hero-btn {
          background: white;
          color: #6c63ff;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin-right: 10px;
          transition: 0.3s;
          display: inline-block;
        }

        .hero-btn2 {
          border: 2px solid white;
          padding: 10px 22px;
          border-radius: 8px;
          text-decoration: none;
          color: white;
          transition: 0.3s;
          display: inline-block;
        }

        .hero-img img {
          width: 380px;
          border-radius: 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.25);
        }

        .section {
          padding: 60px 8%;
        }

        .section h2 {
          text-align: center;
          font-size: 32px;
          margin-bottom: 40px;
          color: #333;
        }

        .batch {
          display: flex;
          align-items: center;
          background: white;
          margin-bottom: 35px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          transition: 0.4s;
        }

        .batch:hover {
          transform: translateY(-8px) scale(1.02);
        }

        .batch img {
          width: 280px;
          height: 200px;
          object-fit: cover;
        }

        .batch-content {
          padding: 30px;
        }

        .batch-content h3 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #333;
        }

        .features {
          font-size: 14px;
          margin-bottom: 15px;
          color: #555;
          line-height: 1.6;
        }

        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: linear-gradient(90deg,#6c63ff,#8a7bff);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: 0.3s;
        }
      ` }} />

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">StudyHub</div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/neet">NEET</Link>
          <span style={{marginLeft: '25px', color: '#6c63ff', fontWeight: 'bold'}}>
            Hi, {session?.user?.name?.split(' ')[0]}!
          </span>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>Crack NEET 2026</h1>
          <p>Welcome back! Join premium NEET batches with expert teachers and live classes.</p>
          <a href="#batches" className="hero-btn">Explore Batches</a>
          <a href="#" className="hero-btn2">Free Demo</a>
        </div>
        <div className="hero-img">
          <img src="https://images.unsplash.com/photo-1584697964154-1c47c1b4b9bb" alt="NEET Prep" />
        </div>
      </section>

      {/* BATCH SECTION */}
      <section className="section" id="batches">
        <h2>Top NEET Batches</h2>

        <div className="batch">
          <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754" alt="Ultimate Batch" />
          <div className="batch-content">
            <h3>NEET 2026 Ultimate Batch</h3>
            <p>Complete NEET preparation with live classes and premium notes.</p>
            <div className="features">
              ✔ Physics + Chemistry + Biology <br />
              ✔ Live Classes <br />
              ✔ Doubt Solving <br />
              ✔ Practice Tests
            </div>
            <a href="#" className="btn">Enroll Now</a>
          </div>
        </div>

        <div className="batch">
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644" alt="Crash Course" />
          <div className="batch-content">
            <h3>NEET Crash Course</h3>
            <p>Fast revision batch with important concepts and MCQ practice.</p>
            <div className="features">
              ✔ Quick Revision <br />
              ✔ Important Questions <br />
              ✔ Daily Practice
            </div>
            <a href="#" className="btn">Enroll Now</a>
          </div>
        </div>
      </section>
    </>
  )
}
