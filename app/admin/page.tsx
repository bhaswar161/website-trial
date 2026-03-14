"use client";
import { useSession } from "next-auth/react";

export default function AdminDebug() {
  const { data: session } = useSession();

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Admin Debug Page</h1>
      <hr />
      <p><strong>Status:</strong> {session ? "✅ Logged In" : "❌ Not Logged In"}</p>
      <p><strong>Your Email:</strong> {session?.user?.email || "None"}</p>
      <p><strong>Is Owner:</strong> {session?.user?.email === "bhaswarray@gmail.com" ? "👑 YES" : "🚫 NO"}</p>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#eee', borderRadius: '8px' }}>
        <p>If "Is Owner" says 🚫 NO, your RLS policies will block every upload.</p>
      </div>
    </div>
  );
}