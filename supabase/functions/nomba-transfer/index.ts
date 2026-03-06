import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Verify the user is authentic securely via Edge Headers
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      console.error("JWT Verification Failed:", authError);
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid Session'}`);
    }

    // Parse Request
    const { amount, accountNumber, accountName, bankCode, reference, narration } = await req.json();

    if (!amount || !accountNumber || !bankCode || !reference) {
      throw new Error("Missing required fields: amount, accountNumber, bankCode, reference");
    }

    const accountId = Deno.env.get("NOMBA_ACCOUNT_ID");
    const clientId = Deno.env.get("NOMBA_CLIENT_ID");
    const clientSecret = Deno.env.get("NOMBA_CLIENT_SECRET");

    if (!accountId || !clientId || !clientSecret) {
      throw new Error("Missing Nomba API credentials in environment variables");
    }

    // 1. Get Access Token from Nomba
    const tokenResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': accountId
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error(`Nomba Auth failed: ${tokenResponse.status} ${errBody}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data?.access_token;
    if (!accessToken) throw new Error("Nomba Auth failed: No access token returned");

    // 2. Perform Transfer
    console.log(`Executing Nomba transfer for Ref: ${reference}, Amount: ${amount}`);

    const transferResponse = await fetch('https://api.nomba.com/v2/transfers/bank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'accountId': accountId
      },
      body: JSON.stringify({
        amount: amount,
        accountNumber: accountNumber,
        accountName: accountName || "Fleet Owner",
        bankCode: bankCode,
        merchantTxRef: reference,
        senderName: "Fleet IQ",
        narration: narration || "Fleet IQ Payout"
      })
    });

    const transferData = await transferResponse.json();

    if (!transferResponse.ok || transferData.code !== "200" || transferData.description !== "SUCCESS") {
      const errString = JSON.stringify(transferData);
      console.error("Nomba Transfer Failed:", errString);
      return new Response(JSON.stringify({
        success: false,
        error: "Nomba Transfer API Error",
        details: transferData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Return 200 so the frontend can read the `details` JSON instead of a generic network fetch 400 crash
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Transfer successful",
      data: transferData.data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err: any) {
    console.error("Transfer Edge Function Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 so the frontend can read the error message natively
    });
  }
});
