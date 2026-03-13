import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Format the Private Key and get IDs
    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || ''; 

    if (!privateKey || !appId || !apiKey) {
      return NextResponse.json({ error: "Config missing" }, { status: 500 });
    }

    const now = Math.floor(Date.now() / 1000);

    // 2. The Payload: Optimized for JaaS strict requirements
    const payload = {
      aud: "jitsi",
      iss: "chat", // UPDATED: Match the exact requirement from the error message
      sub: appId,
      room: roomName,
      iat: now - 10,  // Issued 10 seconds ago to avoid clock-sync issues
      nbf: now - 10,  // Not valid before 10 seconds ago
      exp: now + 3600, // Valid for 1 hour
      context: {
        user: {
          name: isOwner ? "Faculty: Bhaswar" : "Student",
          email: isOwner ? "bhaswarray@gmail.com" : "student@studyhub.com",
          affiliation: isOwner ? "owner" : "member",
        },
        features: {
          livestreaming: true,
          recording: true,
          moderation: isOwner,
          "outbound-call": false
        }
      }
    };

    // 3. Signing Options
    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey,
        typ: 'JWT',
        alg: 'RS256'
      } as any
    };

    // 4. Sign the token
    const token = jwt.sign(payload, privateKey, options);
    
    return NextResponse.json({ token });

  } catch (error) {
    console.error("JWT Error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}