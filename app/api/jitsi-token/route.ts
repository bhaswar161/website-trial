import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || ''; // Must have the slash

    if (!privateKey || !appId || !apiKey) {
      return NextResponse.json({ error: "Config missing" }, { status: 500 });
    }

    const payload = {
      aud: "jitsi",
      iss: "chat", 
      sub: appId,
      room: roomName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
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

    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey,
        typ: 'JWT',
        alg: 'RS256'
      } as any
    };

    const token = jwt.sign(payload, privateKey, options);
    return NextResponse.json({ token });

  } catch (error) {
    console.error("JWT Error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}