"use client";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AllClasses({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params);

  const subjects = [
    { id: 'physics', name: 'Physics', icon: 'P', color: '#6157ff' },
    { id: 'chemistry', name: 'Chemistry', icon: 'C', color: '#ff9800' },
    { id: 'botany', name: 'Botany', icon: 'B', color: '#4caf50' },
    { id: 'zoology', name: 'Zoology', icon: 'Z', color: '#f44336' },
  ];

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <Link href={`/neet/${batchId}`} style={{ textDecoration: 'none', fontSize: '20px', color: '#333', background: '#eee', padding: '10px 15px', borderRadius: '50%' }}>←</Link>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>All Classes</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {subjects.map((sub) => (
          <Link key={sub.id} href={`/neet/${batchId}/all-classes/${sub.id}`} style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: sub.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '24px', fontWeight: 'bold' }}>{sub.icon}</div>
              <h3 style={{ color: '#333', margin: 0 }}>{sub.name}</h3>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}