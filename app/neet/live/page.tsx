'use client'
import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useSession } from 'next-auth/react';

export default function NeetLiveClass() {
  const { data: session } = useSession();
  
  // Use the user's name from session, or default to "NEET Student"
  const userName = session?.user?.name || "NEET Student";

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>
      {/* Small Header for context */}
      <div style={{ padding: '15px 5%', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#6c63ff', margin: 0 }}>NEET Live Batch: Physics Class</h2>
        <span style={{ fontWeight: 'bold' }}>Teacher: Bhaswar Ray</span>
      </div>

      {/* Jitsi Meeting Container */}
      <div style={{ flex: 1 }}>
        <JitsiMeeting
          domain="meet.jit.si"
          roomName="StudyHub_NEET_Batch_2026_Live" // Change this to something unique
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: false,
            startScreenSharing: false,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }}
          userInfo={{
            displayName: userName
          }}
          onApiReady={(externalApi) => {
            // here you can set up event listeners
            // e.g. externalApi.addEventListener('videoConferenceJoined', listener);
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
        />
      </div>
    </div>
  );
}
