"""
Email service for AgriMind AI.
Sends OTP emails via Gmail SMTP using aiosmtplib (async).
"""

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings


async def send_otp_email(to_email: str, otp: str, user_name: str = "Farmer") -> bool:
    """
    Send a real OTP email to the user via Gmail SMTP.
    Returns True on success, False on failure.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # SMTP not configured — caller should fall back to console logging
        return False

    subject = "Your AgriMind AI Verification Code"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0f2d1a,#16a34a);padding:32px;text-align:center;">
                <div style="display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px;margin-bottom:12px;">
                  <span style="font-size:32px;">🌿</span>
                </div>
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">AgriMind AI</h1>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">AI-Powered Smart Agriculture Platform</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:40px 32px;">
                <p style="margin:0 0 8px;color:#334155;font-size:16px;font-weight:500;">Hello {user_name},</p>
                <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                  Use the verification code below to complete your sign up. This code expires in <strong>5 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                  <div style="letter-spacing:12px;font-size:40px;font-weight:800;color:#16a34a;font-family:'Courier New',monospace;">{otp}</div>
                </div>

                <div style="background:#fef9c3;border-left:3px solid #ca8a04;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
                  <p style="margin:0;color:#854d0e;font-size:13px;">
                    ⚠️ Never share this code with anyone. AgriMind AI will never ask for your OTP.
                  </p>
                </div>

                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                  If you didn't request this code, you can safely ignore this email. Your account won't be created without entering the OTP.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  © 2024 AgriMind AI · Smart India Hackathon
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    text_body = f"Your AgriMind AI verification code is: {otp}\nThis code expires in 5 minutes."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AgriMind AI <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"[Email] Failed to send OTP to {to_email}: {e}")
        return False
