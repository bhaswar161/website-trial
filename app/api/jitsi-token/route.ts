import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Get keys and fix the Private Key "Yellow Arrow" newlines
    // This replaces literal '\n' strings with actual line breaks
    const privateKey = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID || '';
    const apiKey = process.env.JITSI_API_KEY || ''; // This is your 'kid' (the one with the slash)

    // 2. Security Guard: Stop if variables are missing
    if (!privateKey || !appId || !apiKey) {
      console.error("❌ Environment Variables Missing");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 3. The Payload: Specific claims required by 8x8 JaaS
    const payload = {
      aud: "jitsi",
      iss: "chat", 
      sub: appId,  // Your App ID (NO slash here)
      room: "*",   // Allows access to any room within your App ID
      context: {
        user: {
          name: isOwner ? "Faculty: Bhaswar" : "Student",
          email: isOwner ? "bhaswarray@gmail.com" : "student@studyhub.com",
          affiliation: isOwner ? "owner" : "member",
        },
        features: {
          livestreaming: true,
          recording: true,
          moderation: isOwner, // This locks the room so students can't kick you
          "outbound-call": false
        }
      }
    };

    // 4. Token Options: This is where we link your API Key (kid)
    const options: SignOptions = {
      algorithm: 'RS256',
      header: { 
        kid: apiKey, // The ID WITH the slash: e.g., vpaas-xxx/e307bb
        typ: 'JWT',
        alg: 'RS256'
      } as any,
      expiresIn: '1h'
    };

    // 5. Generate the Signed Token
    const token = jwt.sign(payload, privateKey, options);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("❌ JWT Generation Error:", error);
    return NextResponse.json({ error: "Authentication failed to generate" }, { status: 500 });
  }
}