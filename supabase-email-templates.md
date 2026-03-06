# Supabase Email Templates

The following are clean HTML email templates that match the Fleet IQ brand (red accents, clean typography, dark contrasts). 

You can copy and paste these directly into your **Supabase Dashboard -> Authentication -> Email Templates**.

---

## 1. Confirm Signup Template
*Replace the default Supabase Confirm Signup template with this:*

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 30px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; margin: 0; }
    .logo-accent { color: #e11d48; }
    .content { padding: 40px; color: #334155; line-height: 1.6; font-size: 16px; }
    .h1 { color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #64748b; background-color: #f1f5f9; }
    .footer a { color: #e11d48; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Fleet<span class="logo-accent">IQ</span></h1>
    </div>
    <div class="content">
      <h2 class="h1">Welcome to Fleet IQ!</h2>
      <p>Hello,</p>
      <p>Thank you for signing up to Fleet IQ, the premier platform for luxury asset rentals and fleet management. Please verify your email address to activate your account and securely log in.</p>
      
      <div class="btn-container">
        <!-- Supabase Confirmation URL Variable -->
        <a href="{{ .ConfirmationURL }}" class="btn">Verify Email Address</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 14px;">{{ .ConfirmationURL }}</p>
      
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    <div class="footer">
      &copy; 2026 Fleet IQ. All rights reserved.<br>
      <a href="https://fleetiq.cc/help">Need Help?</a>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password Template
*Replace the default Supabase Reset Password template with this:*

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 30px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; margin: 0; }
    .logo-accent { color: #e11d48; }
    .content { padding: 40px; color: #334155; line-height: 1.6; font-size: 16px; }
    .h1 { color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #64748b; background-color: #f1f5f9; }
    .footer a { color: #e11d48; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Fleet<span class="logo-accent">IQ</span></h1>
    </div>
    <div class="content">
      <h2 class="h1">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Fleet IQ account. Click the button below to choose a new secure password.</p>
      
      <div class="btn-container">
        <!-- Supabase Confirmation URL Variable -->
        <a href="{{ .ConfirmationURL }}" class="btn">Reset Password</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 14px;">{{ .ConfirmationURL }}</p>
      
      <p>If you didn't request a password reset, your account is still secure and you can ignore this email.</p>
    </div>
    <div class="footer">
      &copy; 2026 Fleet IQ. All rights reserved.<br>
      <a href="https://fleetiq.cc/help">Need Help?</a>
    </div>
  </div>
</body>
</html>
```

---

## Instructions for Supabase

1. Open your **Supabase Dashboard**.
2. Go to **Authentication** > **Email Templates**.
3. Under the **Confirm signup** tab, make sure the subject is something like `Confirm your Fleet IQ Account`. Toggle the "Source" or HTML code editor (`<>`) button, and paste the code from Template 1.
4. Under the **Reset Password** tab, set the subject to `Reset your Fleet IQ Password`, open the HTML code editor, and paste Template 2.
5. In your Supabase URL Configuration (Authentication -> URL Configuration), ensure your **Site URL** is set to `https://fleetiq.cc/login` (or fallback to `http://localhost:3000/login` for local testing) so that users are automatically redirected to the standalone login screen.
