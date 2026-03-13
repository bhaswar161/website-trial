"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function NoticeBoard({ category, isOwner }: { category: 'neet' | 'jee', isOwner: boolean }) {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Fetch for the specific category
    const fetchNotices = async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setNotices(data);
    };
    fetchNotices();

    // 2. Realtime Listener filtered by category
    const channel = supabase
      .channel(`notices-${category}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notices', filter: `category=eq.${category}` }, 
        (payload) => {
          setNotices(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category]);

  const addNotice = async () => {
    const title = prompt("Enter Notice Title:");
    const content = prompt("Enter Notice Content:");
    if (!title || !content) return;

    const { error } = await supabase.from('notices').insert([
      { title, content, category, priority: 'normal' }
    ]);
    if (error) alert("Error posting notice");
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: 'fit-content' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📢 {category.toUpperCase()} Notices
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notices.map(n => (
          <div key={n.id} style={{ padding: '12px', borderRadius: '10px', background: '#f8f9ff', borderLeft: '4px solid #6c63ff' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{n.title}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>{n.content}</div>
          </div>
        ))}
      </div>
      {isOwner && (
        <button onClick={addNotice} style={{ marginTop: '15px', width: '100%', padding: '8px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #6c63ff', background: 'none', color: '#6c63ff' }}>
          + Post for {category.toUpperCase()}
        </button>
      )}
    </div>
  );
}