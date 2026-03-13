import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Extract keys and ensure they aren't undefined/null
    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || '';

    // Guard clause to ensure keys are present
    if (!privateKey || !appId || !apiKey) {
      console.error("❌ Missing Jitsi Environment Variables");
      return NextResponse.json({ error: "Jitsi keys missing on server" }, { status: 500 });
    }

    // 2. Define payload structure
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: roomName,
      context: {
        user: {
          name: isOwner ? "Faculty: Bhaswar" : "Student",
          email: isOwner ? "bhaswarray@gmail.com" : "student@studyhub.com",
          affiliation: isOwner ? "owner" : "member",
        },
        features: {
          livestreaming: isOwner,
          recording: isOwner,
          moderation: isOwner,
          "outbound-call": false
        }
      }
    };

    // 3. Define SignOptions with explicit header casting to fix the TS error
    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey,
        alg: 'RS256',
        typ: 'JWT'
      } as any, // 'as any' bypasses the strict 'JwtHeader' check
      expiresIn: '1h'
    };

    // 4. Create the Security Token
    const token = jwt.sign(payload, privateKey, options);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("❌ JWT Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}