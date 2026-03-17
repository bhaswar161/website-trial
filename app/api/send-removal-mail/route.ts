import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, name, batch, reason } = await req.json();

  try {
    await resend.emails.send({
      from: 'StudyHub <support@yourdomain.com>',
      to: email,
      subject: `Enrollment Revoked: ${batch}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ef4444;">Enrollment Update</h2>
          <p>Hi <b>${name}</b>,</p>
          <p>Your access to the batch <b>${batch}</b> has been revoked by the administrator.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 14px; color: #374151;"><b>Reason for removal:</b></p>
            <p style="margin: 5px 0 0 0; color: #1f2937;">${reason}</p>
          </div>

          <p style="margin-top: 20px;">If you believe this is an error, please contact support.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">This is an automated notification from StudyHub Admin Panel.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send mail" }, { status: 500 });
  }
}
