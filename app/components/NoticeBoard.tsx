"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NoticeBoard({ category, isOwner }: { category: 'neet' | 'jee', isOwner: boolean }) {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchNotices = async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      if (data) setNotices(data);
    };
    fetchNotices();

    // 2. Realtime Listener (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(`notices-${category}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notices', filter: `category=eq.${category}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotices(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotices(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          } else if (payload.eventType === 'DELETE') {
            setNotices(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category]);

  const addNotice = async () => {
    const title = prompt("Notice Title:");
    const content = prompt("Notice Content:");
    if (!title || !content) return;
    await supabase.from('notices').insert([{ title, content, category }]);
  };

  const editNotice = async (notice: any) => {
    const newTitle = prompt("Edit Title:", notice.title);
    const newContent = prompt("Edit Content:", notice.content);
    if (!newTitle || !newContent) return;

    await supabase.from('notices')
      .update({ title: newTitle, content: newContent })
      .eq('id', notice.id);
  };

  const deleteNotice = async (id: string) => {
    if (confirm("Permanently delete this notice?")) {
      await supabase.from('notices').delete().eq('id', id);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', height: 'fit-content', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.2rem' }}>📢 {category.toUpperCase()} Feed</h3>
        {isOwner && <span style={{fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '10px'}}>Admin</span>}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
        {notices.length === 0 && <p style={{color: '#999', textAlign: 'center', fontSize: '14px', padding: '20px'}}>No notices posted yet.</p>}
        {notices.map(n => (
          <div key={n.id} style={{ padding: '16px', borderRadius: '16px', background: '#fcfcfd', border: '1px solid #efefff', transition: 'transform 0.2s' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: '4px' }}>{n.title}</div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{n.content}</div>
            
            {isOwner && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button onClick={() => editNotice(n)} style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                <button onClick={() => deleteNotice(n.id)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <button onClick={addNotice} style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#6c63ff', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)' }}>
          + Create Notice
        </button>
      )}
    </div>
  );
}