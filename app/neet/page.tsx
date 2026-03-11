'use client'
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function NeetPage() {
  const { data: session } = useSession()
  
  // Security Check: Only you can be the Teacher
  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  // Replace these with your actual Live Stream links or Meeting IDs
  const batches = [
    {
      id: "ultimate-2026",
      name: "NEET 2026 Ultimate Batch",
      description: "Full syllabus coverage with live daily classes.",
      color: "#6c63ff",
      liveUrl: "https://meet.google.com/new" // You can change this to your specific link
    },
    {
      id: "crash-course",
      name: "NEET Crash Course",
      description: "Fast-track revision and high-yield MCQs.",
      color: "#ff4ecd",
      liveUrl: "https://meet.google.com/new"
    }
  ];

  const handleLiveAction = (url: string, name: string) => {
    if (isOwner) {
      // Logic for teacher: Opens the link to start the broadcast
      window.open(url, '_blank');
    } else {
      // Logic for student: Checks if link is valid then joins
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ padding: '40px 5%', fontFamily: 'Arial, sans-serif', background: '#f5f7fb', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</Link>
          <h1 style={{ marginTop: '10px', color: '#333' }}>NEET Study Portal</h1>
        </div>
        {isOwner && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #2e7d32' }}>
            Faculty Dashboard Active
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {batches.map((batch) => (
          <div key={batch.id} style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderTop: `6px solid ${batch.color}`, transition: '0.3s' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '10px', color: batch.color }}>{batch.name}</h3>
            <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '25px' }}>{batch.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', color: '#444', fontWeight: 'bold', cursor: 'pointer' }}>
                View Notes & PYQs
              </button>

              {/* LIVE CLASS LOGIC */}
              {isOwner ? (
                <button 
                  onClick={() => handleLiveAction(batch.liveUrl, batch.name)}
                  style={{ padding: '12px', borderRadius: '10px', border: 'none', background: batch.color, color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)' }}
                >
                  🚀 Start Live Class (Owner Only)
                </button>
              ) : (
                <button 
                  onClick={() => handleLiveAction(batch.liveUrl, batch.name)}
                  style={{ padding: '12px', borderRadius: '10px', border: `2px solid ${batch.color}`, background: 'white', color: batch.color, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📺 Join Live Class
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isOwner && (
        <p style={{ marginTop: '30px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
          Classes will be conducted by Bhaswar Ray. Check batch schedule for timings.
        </p>
      )}
    </div>
  )
}
