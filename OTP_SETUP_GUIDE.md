# OTP-Based Forgot Password Integration Guide

## Overview
This guide explains how to set up the OTP (One-Time Password) based forgot password feature with email delivery using Resend.

## What's Changed

### 1. **API Route Created**
- **File:** `src/app/api/auth/send-otp/route.ts`
- Handles OTP generation and email sending
- Integrates with Resend for reliable email delivery
- Professional HTML email template with branding

### 2. **Updated Dependencies**
- Added `resend` package (v3.0.0) to `package.json`
- automatically handles email delivery

### 3. **Updated Forgot Password Page**
- **File:** `src/app/forgot-password/page.tsx`
- Now calls the API route to send OTP emails
- Enhanced error handling and user feedback
- Resend code functionality works via API
- Removed direct `createOtp` import (handled server-side)

### 4. **Environment Configuration**
- Updated `.env.local.example` with `RESEND_API_KEY`

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```
This will install the `resend` package along with other dependencies.

### Step 2: Get Resend API Key
1. Go to [https://resend.com](https://resend.com)
2. Sign up / Log in to your account
3. Go to **API Keys** section
4. Copy your API key

### Step 3: Update Environment Variables
1. Open `.env.local` file in your project root
2. Add the Resend API key:
```env
RESEND_API_KEY=your-resend-api-key-here
```

### Step 4: Verify Email Domain (Production)
In development, Resend allows sending to any email. For production:
1. Go to Resend Dashboard → **Domains**
2. Add your domain (e.g., `mail.leverest.com`)
3. Follow verification steps
4. Update the `from` address in `src/app/api/auth/send-otp/route.ts`:
```typescript
from: 'noreply@mail.leverest.com', // Use your verified domain
```

## How It Works

### User Flow
1. User clicks "Forgot Password"
2. Enters their registered email
3. System checks if email exists in the database
4. Generates a 6-digit OTP
5. Sends email with OTP via Resend
6. User receives email and enters OTP
7. After verification, can reset password
8. Password is updated securely

### OTP Details
- **Validity:** 10 minutes
- **Format:** 6 digits
- **Storage:** Client-side localStorage (for now)
- **Expiry:** Automatically validated on submission

## Email Template
The OTP email includes:
- Professional branding with Leverest colors
- Clear OTP code display
- Expiry warning (10 minutes)
- Security reminder
- Support contact information
- Responsive design that works on all devices

## Testing

### Local Testing
1. In development, OTP is still logged to console (see `src/lib/dynamic.ts`)
2. Check your browser console for the OTP code
3. Use it in the forgot password form

### With Real Email
1. Make sure `RESEND_API_KEY` is set in `.env.local`
2. Use any email address (in development)
3. Wait for email to arrive (usually within seconds)

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify Resend API key is correct
3. Check that the email address is registered in the system
4. Check server logs for errors

### API Errors
- **400 Bad Request:** Email missing from request
- **500 Internal Server Error:** Check Resend API key and server logs

### Email Template Issues
- Emails are sent as HTML
- Test across different email clients (Gmail, Outlook, Apple Mail, etc.)

## Database Integration (Optional)
Currently, OTPs are stored client-side. For better security, consider:

1. Creating an `otp_codes` table in Supabase:
```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);
```

2. Update `src/lib/dynamic.ts` to use Supabase instead of localStorage

3. Update `src/app/api/auth/send-otp/route.ts` to validate against database

## Security Best Practices

✅ **Already Implemented:**
- OTP expiry (10 minutes)
- Server-side validation
- HTTPS-only communication
- API rate limiting (consider adding)

📋 **Consider Adding:**
- Rate limiting per email (prevent brute force)
- IP-based rate limiting
- OTP attempt counter (max 3 attempts)
- Audit logging for password resets
- Two-factor authentication (2FA)

## Future Enhancements

1. **SMS OTP:** Use Twilio for SMS delivery
2. **Backup Codes:** Generate one-time backup codes
3. **Email Verification:** Verify email on signup
4. **Account Recovery:** Multiple recovery methods
5. **Security Audit Logs:** Track all password reset attempts

## Support

For issues with:
- **Resend:** Visit [Resend Documentation](https://resend.com/docs)
- **Next.js:** Visit [Next.js Docs](https://nextjs.org/docs)
- **Your Application:** Check server logs and browser console
