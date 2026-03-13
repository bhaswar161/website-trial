"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Leaderboard({ category }: { category: 'neet' | 'jee' }) {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('batch', category)
        .order('points', { ascending: false })
        .limit(10);
      if (data) setStudents(data);
    };

    fetchLeaderboard();

    // Listen for score updates in real-time
    const channel = supabase.channel('leaderboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, fetchLeaderboard)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category]);

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
      <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#333' }}>🏆 Top Performers</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {students.map((student, index) => (
          <div key={student.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', 
            borderRadius: '15px', background: index === 0 ? '#fff9e6' : '#fcfcfd',
            border: index === 0 ? '1px solid #ffd700' : '1px solid #eee'
          }}>
            <span style={{ fontWeight: 'bold', width: '25px', color: index === 0 ? '#ffd700' : '#888' }}>
              #{index + 1}
            </span>
            
            <img 
              src={student.profile_pic || "https://via.placeholder.com/40"} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              alt="pfp"
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{student.full_name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{student.points} XP</div>
            </div>

            {index === 0 && <span>👑</span>}
          </div>
        ))}
      </div>
    </div>
  );
}