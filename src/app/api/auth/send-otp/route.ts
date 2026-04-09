import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createOtp } from '@/lib/dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = createOtp(email);

    // Send email using Resend
    const response = await resend.emails.send({
      from: 'noreply@leverestfin.com',
      to: email,
      subject: 'Your Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #F0B429 0%, #C9960C 100%);
                padding: 30px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
              }
              .content {
                padding: 40px 30px;
              }
              .otp-box {
                background-color: #f9f9f9;
                border: 2px solid #F0B429;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .otp-code {
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #F0B429;
                margin: 0;
                font-family: 'Courier New', monospace;
              }
              .otp-label {
                color: #666;
                font-size: 14px;
                margin-top: 10px;
              }
              .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                color: #999;
                font-size: 12px;
                border-top: 1px solid #eee;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
                color: #856404;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset</h1>
              </div>
              <div class="content">
                <p style="color: #333; font-size: 16px; margin-top: 0;">
                  Hi,
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  You requested to reset your password. Use the verification code below to proceed with your password reset.
                </p>
                
                <div class="otp-box">
                  <p class="otp-code">${otp}</p>
                  <p class="otp-label">Verification Code</p>
                </div>

                <div class="warning">
                  <strong>Important:</strong> This code will expire in 10 minutes. Do not share this code with anyone.
                </div>

                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                  If you did not request this password reset, please ignore this email or contact our support team immediately.
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  <strong>Need help?</strong> Contact our support team at support@leverest.com
                </p>
              </div>
              <div class="footer">
                <p style="margin: 0;">© ${new Date().getFullYear()} Leverest. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'OTP sent to email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
