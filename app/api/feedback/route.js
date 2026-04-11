// Place this file at: app/api/feedback/route.js in your Next.js project
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.FEEDBACK_TO_EMAIL || "rstromberg11@gmail.com";

export async function POST(request) {
  try {
    const { rating, role, message, email } = await request.json();

    if (!rating || !message) {
      return Response.json(
        { error: "Rating and message are required." },
        { status: 400 }
      );
    }

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const roleLabel = role || "Not specified";
    const replyTo = email || undefined;

    await resend.emails.send({
      from: "RowLab Feedback <onboarding@resend.dev>",
      to: TO_EMAIL,
      ...(replyTo && { replyTo }),
      subject: `RowLab Feedback ${stars} — ${roleLabel}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
          <div style="background: linear-gradient(135deg, #0b1020, #1e293b); padding: 32px; border-radius: 12px 12px 0 0;">
            <div style="color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">RowLab Feedback</div>
            <div style="color: #fbbf47; font-size: 28px; letter-spacing: 2px;">${stars}</div>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 100px;">Rating</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${rating} / 5</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Role</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${roleLabel}</td>
              </tr>
              ${email ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;"><a href="mailto:${email}" style="color: #0b1020;">${email}</a></td>
              </tr>` : ""}
            </table>
            <div style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Message</div>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.7; color: #0f172a;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Feedback send error:", error);
    return Response.json(
      { error: "Failed to send feedback. Please try again." },
      { status: 500 }
    );
  }
}
