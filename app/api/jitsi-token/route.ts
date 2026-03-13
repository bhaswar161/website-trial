import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Fetch environment variables
    // .replace(/\\n/g, '\n') is vital for Vercel to read the multi-line private key
    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || ''; // This is your 'kid' (with slash)

    if (!privateKey || !appId || !apiKey) {
      console.error("❌ Environment Variables Missing");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. The Payload: Refined for strict JaaS validation
    const payload = {
      aud: "jitsi",
      iss: "chat", // If this fails again, try changing "chat" to appId
      sub: appId,  // Your App ID (e.g., vpaas-magic-cookie-...)
      room: roomName, // Explicitly naming the room is more secure than "*"
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      context: {
        user: {
          name: isOwner ? "Faculty: Bhaswar" : "Student",
          email: isOwner ? "bhaswarray@gmail.com" : "student@studyhub.com",
          avatar: "",
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

    // 3. Token Options
    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey, 
        typ: 'JWT',
        alg: 'RS256'
      } as any
    };

    // 4. Generate the Signed Token
    const token = jwt.sign(payload, privateKey, options);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("❌ JWT Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error during token sign" }, { status: 500 });
  }
}