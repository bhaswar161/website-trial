'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
        body { background: #f5f7fb; }
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 60px; background: white; box-shadow: 0 3px 12px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 10; }
        .logo { font-size: 28px; font-weight: bold; color: #6a1b9a; }
        .nav-links a, .nav-links button { margin-left: 25px; text-decoration: none; color: #333; font-weight: 500; transition: 0.3s; background: none; border: none; font-size: 16px; cursor: pointer; }
        .nav-links a:hover, .nav-links button:hover { color: #6a1b9a; }
        .hero { display: flex; align-items: center; justify-content: space-between; padding: 80px 60px; background: linear-gradient(135deg,#6a1b9a,#ff4ecd); border-radius: 0 0 40px 40px; color: white; }
        .hero h1 { font-size: 48px; line-height: 1.2; }
        .hero p { margin-top: 20px; font-size: 18px; opacity: 0.9; }
        .hero button { margin-top: 30px; padding: 15px 35px; border: none; border-radius: 8px; background: white; color: #6a1b9a; font-weight: bold; cursor: pointer; }
        .hero img { width: 400px; transform: rotate(-5deg); }
        .section { padding: 80px 40px; text-align: center; }
        .courses { display: flex; justify-content: center; flex-wrap: wrap; gap: 30px; margin-top: 40px; }
        .course-card { background: white; padding: 35px; width: 260px; border-radius: 20px; box-shadow: 0 12px 28px rgba(0,0,0,0.12); position: relative; }
        .course-card h3 { color: #6a1b9a; margin-bottom: 10px; }
        .btn { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #6a1b9a; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; }
        footer { margin-top: 60px; padding: 25px; text-align: center; background: #6a1b9a; color: white; }
      ` }} />

      <div className="navbar">
        <div className="logo">StudyHub</div>
        <div className="nav-links">
          <Link href="/">Home</Link>
          {session ? (
            <button onClick={() => signOut()}>Logout ({session.user?.name?.split(' ')[0]})</button>
          ) : (
            <button onClick={() => signIn('google')}>Login</button>
          )}
          <Link href="/neet">NEET</Link>
        </div>
      </div>

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
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="Hero" />
      </div>

      <div className="section">
        <h2>Popular Courses</h2>
        <div className="courses">
          <div className="course-card">
            <h3>Class 11</h3>
            <p>Physics, Chemistry, Biology & Maths</p>
            <Link href="#" className="btn">Explore</Link>
          </div>
          <div className="course-card">
            <h3>Class 12</h3>
            <p>Boards + Competitive Prep</p>
            <Link href="#" className="btn">Explore</Link>
          </div>
          <div className="course-card">
            <h3>NEET</h3>
            <p>MCQs, PYQs and Mock Tests</p>
            <Link href="/neet" className="btn">Explore</Link>
          </div>
        </div>
      </div>

      <footer>
        © 2026 StudyHub | Free Education Platform | Made by Bhaswar Ray
      </footer>
    </>
  )
}
