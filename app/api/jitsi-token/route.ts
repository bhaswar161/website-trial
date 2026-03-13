import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Get keys and fix the Private Key newlines
    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || ''; // This is the 'kid' (with slash)

    if (!privateKey || !appId || !apiKey) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    // 2. The Payload: JaaS is very strict about these fields
    const payload = {
      aud: "jitsi",
      iss: "chat", // Must be 'chat'
      sub: appId,  // Must be your App ID (no slash)
      room: "*",   // Using '*' allows this token for any room in your App ID
      context: {
        user: {
          name: isOwner ? "Faculty: Bhaswar" : "Student",
          email: isOwner ? "bhaswarray@gmail.com" : "student@studyhub.com",
          affiliation: isOwner ? "owner" : "member",
        },
        features: {
          livestreaming: true,
          recording: true,
          moderation: isOwner, // Locks the room for students
          "outbound-call": false
        }
      }
    };

    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey, // This MUST be the ID with the slash: appId/keyId
        typ: 'JWT',
        alg: 'RS256'
      } as any,
      expiresIn: '1h'
    };

    const token = jwt.sign(payload, privateKey, options);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("JWT Error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}