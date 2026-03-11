'use client'
import React from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

// This is the magic part: it tells Next.js to only load Jitsi on the client side
const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

export default function NeetLiveClass() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "NEET Student";

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>
      <div style={{ padding: '15px 5%', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#6c63ff', margin: 0 }}>NEET Live Batch: Physics Class</h2>
        <span style={{ fontWeight: 'bold' }}>Instructor Mode</span>
      </div>

      <div style={{ flex: 1 }}>
        {/* We wrap it in a check to make sure it only renders when the component is ready */}
        <JitsiMeeting
          domain="meet.jit.si"
          roomName="StudyHub_NEET_Batch_2026_Live"
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: false,
            startScreenSharing: false,
          }}
          userInfo={{
            displayName: userName
          }}
          getIFrameRef={(iframeRef) => { 
            if (iframeRef) iframeRef.style.height = '100%'; 
          }}
        />
      </div>
    </div>
  );
}
