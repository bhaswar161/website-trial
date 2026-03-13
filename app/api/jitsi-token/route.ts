import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { roomName, isOwner } = await req.json();

    // 1. Get your keys from Environment Variables
    const privateKey = process.env.JITSI_PRIVATE_KEY?.replace(/\\n/g, '\n'); 
    const appId = process.env.JITSI_APP_ID;
    const apiKey = process.env.JITSI_API_KEY;

    if (!privateKey || !appId || !apiKey) {
      return NextResponse.json({ error: "Jitsi keys missing on server" }, { status: 500 });
    }

    // 2. Create the Security Token
    const token = jwt.sign({
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
          moderation: isOwner, // THIS locks the room so only YOU are the boss
          "outbound-call": false
        }
      }
    }, privateKey, { 
      algorithm: 'RS256', 
      header: { kid: apiKey },
      expiresIn: '1h' 
    });

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}