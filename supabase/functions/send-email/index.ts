import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  template: string;
  data: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, template, data } = await req.json() as EmailRequest;

    let subject = "Notification from Fleet IQ";
    let html = "";

    // Common Styles
    const style = `
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .header { background: #0f172a; padding: 30px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 26px; font-weight: 700; text-decoration: none; letter-spacing: 1px; }
          .content { padding: 40px 30px; }
          .h1 { font-size: 24px; margin-bottom: 24px; color: #0f172a; font-weight: 700; text-align: center; }
          .p { margin-bottom: 16px; font-size: 16px; color: #475569; line-height: 26px; }
          .highlight { color: #e11d48; font-weight: bold; }
          .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0; width: 100%; border-collapse: separate; }
          .detail-row td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          .detail-row:last-child td { border-bottom: none; }
          .label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 40%; }
          .value { font-size: 15px; color: #0f172a; font-weight: 600; text-align: right; width: 60%; }
          .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
          .btn { 
            display: inline-block; 
            background: #e11d48;
            background: linear-gradient(90deg, #ef4444 0%, #f97316 100%);
            color: #ffffff !important; 
            padding: 16px 32px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 700; 
            font-size: 16px;
            margin-top: 24px; 
            text-align: center;
            box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
          }
        `;

    const wrapper = (content: string) => `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>${style}</style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">Fleet IQ</div>
                </div>
                <div class="content">
                  ${content}
                </div>
                <div class="footer">
                  &copy; ${new Date().getFullYear()} WebIQ Inc. All rights reserved.<br>
                  Lagos, Nigeria
                </div>
              </div>
            </body>
          </html>
        `;

    // Fetch dynamic live exchange rate
    let ngnRate = 1650; // Fallback
    try {
      const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        if (rateData?.rates?.NGN) {
          ngnRate = Math.round(rateData.rates.NGN + 20); // API rate + 20 spread buffer (matches frontend)
        }
      }
    } catch (e) {
      console.error('Failed to fetch live NGN rate for email, using fallback', e);
    }

    switch (template) {
      case 'booking_request':
        subject = `New Booking Request: ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">New Booking Request 🔔</div>
                  <div class="p">Hello,</div>
                  <div class="p">A new booking request has been initiated. Please review the details below.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #f59e0b; background-color: #fef3c7; color: #b45309; border-radius: 4px;">
                    ${to === data.renterEmail
            ? `<strong>For Renters:</strong> Your request has been sent to the owner. <br><strong>Next Step:</strong> Wait for the owner to accept your request before making payment.`
            : `<strong>For Fleet Owners:</strong> You have a new booking request to review. <br><strong>Next Step:</strong> Go to your dashboard to Accept or Reject.`
          }
                  </div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr class="detail-row"><td class="label">Asset</td> <td class="value">${data.assetName}</td></tr>
                    <tr class="detail-row"><td class="label">Renter</td> <td class="value">${data.renterName}</td></tr>
                    <tr class="detail-row"><td class="label">Pickup</td> <td class="value">${data.pickupLocation}</td></tr>
                    <tr class="detail-row"><td class="label">Date</td> <td class="value">${data.pickupDate} @ ${data.pickupTime}</td></tr>
                    <tr class="detail-row"><td class="label">Dropoff</td> <td class="value">${data.dropoffLocation}</td></tr>
                    <tr class="detail-row"><td class="label">Return</td> <td class="value">${data.returnDate}</td></tr>
                    <tr class="detail-row"><td class="label">Total Payout</td> <td class="value highlight">₦${Math.round(Number(data.amount) * ngnRate).toLocaleString()}</td></tr>
                  </table>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard/bookings" class="btn">View Booking</a>
                  </div>
                `);
        break;

      case 'booking_accepted':
        subject = `Booking Accepted: ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">Booking Accepted 🎉</div>
                  <div class="p">Hello,</div>
                  <div class="p">The fleet owner has accepted your request for <strong>${data.assetName}</strong>!</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                    <strong>Next Step:</strong> Click the button below or go to your Trips dashboard to Pay Now and secure your booking. Unpaid bookings may be automatically cancelled.
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/account/trips" class="btn">Pay Now</a>
                  </div>
                `);
        break;

      case 'booking_rejected':
        subject = `Booking Declined: ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">Booking Declined ❌</div>
                  <div class="p">Hello,</div>
                  <div class="p">We are sorry, but the fleet owner has declined your booking request for <strong>${data.assetName}</strong>.</div>
                  <div class="p">Your calendar dates have been freed. You can browse the marketplace to find another fantastic vehicle suited for your trip.</div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/marketplace" class="btn">Browse Marketplace</a>
                  </div>
                `);
        break;

      case 'payment_confirmed':
        subject = `Payment Confirmed: ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">Payment Confirmed ✨</div>
                  <div class="p">Hello,</div>
                  <div class="p">The payment for the booking of <strong>${data.assetName}</strong> has been successfully confirmed.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                     ${data.role === 'renter' || to === data.renterEmail
            ? `<strong>Payment Received:</strong> Your payment has been received and is secured in an escrow until you confirm the trip is successful.<br><br>Please find the invoice of your payment attached below.`
            : `<strong>Payment Secured:</strong> The renter has made payment and the funds are in a secured escrow. You can now proceed with rendering the renter the service they requested for.`
          }
                  </div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
                    <tr><td colspan="2" style="background:#0f172a; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">INVOICE SUMMARY</td></tr>
                    <tr class="detail-row"><td class="label">Booking ID</td> <td class="value" style="font-family: monospace;">${data.bookingId || data.assetName.substring(0, 6)}</td></tr>
                    <tr class="detail-row"><td class="label">Asset</td> <td class="value">${data.assetName}</td></tr>
                    <tr class="detail-row"><td class="label">Pickup</td> <td class="value">${data.pickupLocation}</td></tr>
                    <tr class="detail-row"><td class="label">Date</td> <td class="value">${data.pickupDate} @ ${data.pickupTime}</td></tr>
                    <tr class="detail-row"><td class="label">Total Paid</td> <td class="value highlight" style="font-size: 18px;">₦${Math.round(Number(data.amount) * ngnRate).toLocaleString()}</td></tr>
                  </table>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc" class="btn">Go to Dashboard</a>
                  </div>
                `);
        break;

      case 'booking_status':
        subject = `Booking Update: ${data.status} - ${data.assetName}`;
        const isSubmitted = data.status === 'Submitted';
        const isAssigned = data.status === 'Assigned';

        let statusMessage = `The status of your booking for <strong>${data.assetName}</strong> has changed to <strong>${data.status}</strong>.`;
        if (isSubmitted) statusMessage = 'Your booking request has been successfully submitted and is awaiting approval.';
        if (isAssigned) statusMessage = 'Great news! A crew member has been assigned to your trip. (See details below)';
        if (data.status === 'Completed') statusMessage = 'Your trip has been marked as completed. We hope you had a great experience!';

        html = wrapper(`
                  <div class="h1">Booking ${data.status} ${isSubmitted || isAssigned ? '🚀' : ''}</div>
                  <div class="p">Hi ${data.renterName},</div>
                  <div class="p">${statusMessage}</div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr class="detail-row"><td class="label">Asset</td> <td class="value">${data.assetName}</td></tr>
                    <tr class="detail-row"><td class="label">Status</td> <td class="value">${data.status}</td></tr>
                    <tr class="detail-row"><td class="label">Pickup Location</td> <td class="value">${data.pickupLocation || 'N/A'}</td></tr>
                    <tr class="detail-row"><td class="label">Pickup Date</td> <td class="value">${data.pickupDate || 'N/A'} @ ${data.pickupTime || ''}</td></tr>
                    ${data.crewName ? `
                    <tr><td colspan="2" style="padding-top: 15px; border-top: 1px dashed #e2e8f0; font-weight: bold; color: #0f172a; padding-bottom: 5px;">Crew Details</td></tr>
                    <tr class="detail-row"><td class="label">Name</td> <td class="value">${data.crewName}</td></tr>
                    <tr class="detail-row"><td class="label">Phone</td> <td class="value">${data.crewPhone || 'N/A'}</td></tr>
                    ` : ''}
                  </table>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/account/trips" class="btn">View My Trips</a>
                  </div>
                `);
        break;

      case 'crew_assignment':
        subject = `New Assignment: ${data.assetName} - ${data.pickupDate}`;
        html = wrapper(`
                  <div class="h1">You have a New Assignment 👨‍✈️</div>
                  <div class="p">Hi ${data.crewName},</div>
                  <div class="p">You have been assigned to a new trip. Please review the schedule and client details below.</div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr class="detail-row"><td class="label">Asset</td> <td class="value">${data.assetName}</td></tr>
                    <tr class="detail-row"><td class="label">Client</td> <td class="value">${data.renterName}</td></tr>
                    <tr class="detail-row"><td class="label">Client Phone</td> <td class="value">${data.renterPhone || 'N/A'}</td></tr>
                    <tr><td colspan="2" style="border-top: 1px solid #e2e8f0; padding: 5px 0;"></td></tr>
                    <tr class="detail-row"><td class="label">Pickup</td> <td class="value">${data.pickupLocation}</td></tr>
                    <tr class="detail-row"><td class="label">Time</td> <td class="value">${data.pickupDate} @ ${data.pickupTime}</td></tr>
                    <tr class="detail-row"><td class="label">Dropoff</td> <td class="value">${data.dropoffLocation}</td></tr>
                    <tr class="detail-row"><td class="label">Return Date</td> <td class="value">${data.returnDate}</td></tr>
                  </table>

                  <div class="p" style="font-size: 14px; color: #64748b; background: #fffbeb; padding: 10px; border-radius: 4px; margin-top: 20px;">
                    ⚠️ Please ensure you arrive 15 minutes before the pickup time.
                  </div>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard" class="btn">View Schedule</a>
                  </div>
                `);
        break;

      case 'support_ticket':
        subject = `Support Ticket Received: #${data.ticketId}`;
        html = wrapper(`
                  <div class="h1">Support Request Received</div>
                  <div class="p">Hi ${data.name},</div>
                  <div class="p">We have received your support request regarding: <strong>"${data.subject}"</strong>.</div>
                  
                  <div class="details-card" style="background: #f0f9ff; border-color: #bae6fd; text-align: center;">
                    <div style="font-size: 12px; color: #0284c7; margin-bottom: 5px;">TICKET REFERENCE ID</div>
                    <div style="font-size: 24px; color: #0f172a; font-weight: bold;">${data.ticketId}</div>
                  </div>

                  <div class="p">Our team is reviewing your request and will get back to you shortly.</div>
                `);
        break;

      case 'asset_approved':
        subject = `Asset Approved: ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">Your Asset is Approved! 🚘</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">Great news! Your asset <strong>${data.assetName}</strong> has been approved by our admin team and is now live on the marketplace.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                    Users can now browse and book this asset. Ensure your calendar is up to date!
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard" class="btn">View Registry</a>
                  </div>
                `);
        break;

      case 'crew_approved':
        subject = `Crew Member Approved: ${data.crewName}`;
        html = wrapper(`
                  <div class="h1">Crew Approved! 👨‍✈️</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">Great news! Your crew member <strong>${data.crewName}</strong> has been verified and approved by our admin team.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                    They can now be assigned to any of your upcoming trips and dispatch operations.
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard" class="btn">View Crew</a>
                  </div>
                `);
        break;

      case 'renters_favorite':
        subject = `Congratulations! 🏆 ${data.assetName} is a Renter's Favorite`;
        html = wrapper(`
                  <div class="h1">Renter's Favorite 🌟</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">Incredible news! Your asset <strong>${data.assetName}</strong> has officially been awarded the <strong>Renter's Favorite</strong> badge on Fleet IQ.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #f59e0b; background-color: #fffbeb; color: #b45309; border-radius: 4px;">
                    This exclusive milestone is awarded only to assets that maintain an average rating of 4.8 or higher with at least 5 reviews. It will now prominently display a beautiful Renter's Favorite badge to all guests browsing the platform!
                  </div>
                  
                  <div class="p">Thank you for maintaining such exceptional standards and providing incredible experiences to our renters. Keep up the fantastic work!</div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard" class="btn">View Your Fleet</a>
                  </div>
                `);
        break;

      case 'trip_completed':
        subject = `Trip Completed! Funds Available for ${data.assetName}`;
        html = wrapper(`
                  <div class="h1">Trip Completed! 🏁</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">The renter has officially confirmed that the trip for <strong>${data.assetName}</strong> has been successfully completed.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                    <strong>Great news!</strong> Your payout for this trip is now available for withdrawal. You can head over to your Wallet to request a payout to your default bank account.
                  </div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr class="detail-row"><td class="label">Booking Ref</td> <td class="value">${data.bookingId.substring(0, 8).toUpperCase()}</td></tr>
                    <tr class="detail-row"><td class="label">Asset</td> <td class="value">${data.assetName}</td></tr>
                    <tr class="detail-row"><td class="label">Renter</td> <td class="value">${data.renterName}</td></tr>
                  </table>

                  <div style="text-align: center; margin-top: 20px;">
                    <a href="https://fleetiq.cc/dashboard/settings" class="btn">View My Wallet</a>
                  </div>
                `);
        break;

      case 'payout_requested':
        subject = `New Payout Request Initiated`;
        html = wrapper(`
                  <div class="h1">Payout Request Initiated 💸</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">We have successfully received your request to withdraw funds from your Fleet IQ Wallet.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #f59e0b; background-color: #fef3c7; color: #b45309; border-radius: 4px;">
                    Your request is now pending admin review safely in Escrow. Payouts are typically processed within 24 - 48 hours.
                  </div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="background:#0f172a; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">WITHDRAWAL SUMMARY</td></tr>
                    <tr class="detail-row"><td class="label">Amount</td> <td class="value highlight" style="font-size: 18px;">${data.currency === 'NGN' ? '₦' : '$'}${Number(data.amount).toLocaleString()}</td></tr>
                    <tr class="detail-row"><td class="label">Bank</td> <td class="value">${data.bankName}</td></tr>
                    <tr class="detail-row"><td class="label">Account</td> <td class="value" style="font-family: monospace;">${data.accountNumber}</td></tr>
                  </table>

                  <div class="p" style="font-size: 14px; color: #64748b; background: #fffbeb; padding: 10px; border-radius: 4px; margin-top: 20px;">
                    ⚠️ We will notify you again once the funds have been approved and released to your bank.
                  </div>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard/settings" class="btn">View Wallet Ledger</a>
                  </div>
                `);
        break;

      case 'admin_payout_requested':
        subject = `ACTION REQUIRED: New Fleet Owner Payout Request 🚨`;
        html = wrapper(`
                  <div class="h1">New Payout Request 💸</div>
                  <div class="p">Hello <strong>Finance Team</strong>,</div>
                  <div class="p">A Fleet Owner has just submitted a new withdrawal request. The funds have been securely deducted from their wallet and are pending your review.</div>
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="background:#0f172a; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">REVIEW DETAILS</td></tr>
                    <tr class="detail-row"><td class="label">Owner</td> <td class="value">${data.ownerName}</td></tr>
                    <tr class="detail-row"><td class="label">Amount</td> <td class="value highlight" style="font-size: 18px;">${data.currency === 'NGN' ? '₦' : '$'}${Number(data.amount).toLocaleString()}</td></tr>
                    <tr class="detail-row"><td class="label">Bank Name</td> <td class="value">${data.bankName}</td></tr>
                    <tr class="detail-row"><td class="label">Account Number</td> <td class="value" style="font-family: monospace;">${data.accountNumber}</td></tr>
                  </table>

                  <div class="p" style="margin-top: 20px;">
                    <strong>Instructions for Accountants:</strong><br>
                    1. Verify the bank details match the registered owner's name.<br>
                    2. Verify there are no pending disputes on recent bookings.<br>
                    3. Initiate the transfer to the coordinates above using our payment gateways.<br>
                    4. Once successfully transferred, log into the Admin Dashboard and click <strong>"Approve"</strong> to close out this ledger entry.
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="https://flowers.fleetiq.cc/finance" class="btn" style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);">Review in Admin Panel</a>
                  </div>
                `);
        break;

      case 'payout_approved':
        subject = `Payout Approved: Funds Released to Your Bank`;
        html = wrapper(`
                  <div class="h1">Payout Approved! 🎉</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">Great news! Your recent payout request has been officially <strong>approved</strong> by our finance team, and the funds have been successfully released to your bank account.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 4px;">
                    Depending on your bank, it may take a few hours for the funds to reflect in your available balance.
                  </div>
                  
                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="background:#10b981; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">DEPOSIT SUMMARY</td></tr>
                    <tr class="detail-row"><td class="label">Amount Sent</td> <td class="value highlight" style="font-size: 18px; color: #047857;">${data.currency === 'NGN' ? '₦' : '$'}${Number(data.amount).toLocaleString()}</td></tr>
                    <tr class="detail-row"><td class="label">Dest. Bank</td> <td class="value">${data.bankName}</td></tr>
                    <tr class="detail-row"><td class="label">Account</td> <td class="value" style="font-family: monospace;">${data.accountNumber}</td></tr>
                  </table>

                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard/settings" class="btn" style="background: linear-gradient(90deg, #10b981 0%, #047857 100%);">View Ledger</a>
                  </div>
                `);
        break;

      case 'payout_rejected':
        subject = `Action Required: Payout Request Declined`;
        html = wrapper(`
                  <div class="h1">Payout Request Declined 🛑</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">We are writing to inform you that your recent request to withdraw funds has unfortunately been declined by our finance team.</div>
                  
                  <div class="p" style="padding: 15px; border-left: 4px solid #e11d48; background-color: #ffe4e6; color: #9f1239; border-radius: 4px;">
                    <strong>FUNDS SECURED:</strong> Don't worry, your requested amount of ${data.currency === 'NGN' ? '₦' : '$'}${Number(data.amount).toLocaleString()} has been safely refunded to your Fleet IQ Wallet.
                  </div>
                  
                  <div class="p" style="margin-top: 20px;">
                    <strong>Why did this happen?</strong><br>
                    Payouts are usually declined if there is a mismatch with the bank details provided, or if our fraud protection system flags a request for security review.
                  </div>

                  <div class="p">Please double-check your bank information and try requesting the payout again from your wallet. If you believe this is an error, contact our support team immediately.</div>
                  
                  <div style="text-align: center;">
                    <a href="https://fleetiq.cc/dashboard/settings" class="btn">Return to Wallet</a>
                  </div>
                `);
        break;

      case 'kyc_approved':
        subject = `✅ Identity Verified — Welcome to Fleet IQ`;
        html = wrapper(`
                  <div class="h1">You're Verified! 🎉</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">Great news! Our team has successfully reviewed your submitted documents and your Fleet IQ account has been <strong>fully verified</strong>.</div>

                  <div class="p" style="padding: 18px; border-left: 4px solid #10b981; background-color: #d1fae5; color: #047857; border-radius: 8px; margin: 24px 0;">
                    <strong>You now have full access to the Fleet IQ platform.</strong><br><br>
                    You can start listing your assets on the marketplace, managing your crew, tracking live bookings, and receiving payments — all from your dashboard.
                  </div>

                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="background:#10b981; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">ACCOUNT STATUS</td></tr>
                    <tr class="detail-row"><td class="label">Account</td> <td class="value">${data.email}</td></tr>
                    <tr class="detail-row"><td class="label">Status</td> <td class="value" style="color: #10b981; font-size: 16px;">✅ Verified</td></tr>
                    <tr class="detail-row"><td class="label">Verified On</td> <td class="value">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                  </table>

                  <div style="text-align: center; margin-top: 24px;">
                    <a href="https://fleetiq.cc" class="btn" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%);">Go to My Dashboard</a>
                  </div>

                  <div class="p" style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
                    Questions? Reach us at <a href="mailto:support@fleetiq.cc" style="color: #e11d48;">support@fleetiq.cc</a>
                  </div>
                `);
        break;

      case 'kyc_rejected':
        subject = `Action Required: Verification Unsuccessful`;
        html = wrapper(`
                  <div class="h1">Verification Unsuccessful 🛑</div>
                  <div class="p">Hi ${data.ownerName},</div>
                  <div class="p">We have reviewed the documents you submitted for identity verification on Fleet IQ. Unfortunately, we were unable to verify your account at this time.</div>

                  <div class="p" style="padding: 18px; border-left: 4px solid #e11d48; background-color: #ffe4e6; color: #9f1239; border-radius: 8px; margin: 24px 0;">
                    <strong>Reason for rejection:</strong><br><br>
                    ${data.rejectionNote || 'Your document could not be verified. This may be due to image quality, expired documents, or a mismatch in information.'}
                  </div>

                  <div class="p"><strong>What to do next:</strong></div>
                  <div class="p" style="font-size: 15px; color: #475569;">
                    1. Review the reason above carefully.<br>
                    2. Prepare a clear, valid, unexpired government-issued ID or business document.<br>
                    3. Contact our support team to resubmit your documents.
                  </div>

                  <table class="details-card" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="background:#0f172a; color:white; padding: 10px; font-weight:bold; border-radius: 6px 6px 0 0; text-align: center;">ACCOUNT STATUS</td></tr>
                    <tr class="detail-row"><td class="label">Account</td> <td class="value">${data.email}</td></tr>
                    <tr class="detail-row"><td class="label">Status</td> <td class="value" style="color: #e11d48;">❌ Rejected</td></tr>
                  </table>

                  <div style="text-align: center; margin-top: 24px;">
                    <a href="mailto:support@fleetiq.cc?subject=KYC Resubmission Request&body=Hi Fleet IQ Team, I would like to resubmit my KYC documents. My email is: ${data.email}" class="btn">Contact Support to Resubmit</a>
                  </div>

                  <div class="p" style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
                    We are here to help. Reply to this email or write to <a href="mailto:support@fleetiq.cc" style="color: #e11d48;">support@fleetiq.cc</a>
                  </div>
                `);
        break;

      default:
        html = wrapper(`<div class="p">${data.message}</div>`);
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Fleet IQ <noreply@fleetiq.cc>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
