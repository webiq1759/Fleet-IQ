// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, payload } = await req.json()
    const accountId = Deno.env.get('NOMBA_ACCOUNT_ID')
    const clientId = Deno.env.get('NOMBA_CLIENT_ID')
    const clientSecret = Deno.env.get('NOMBA_CLIENT_SECRET')

    if (!accountId || !clientId || !clientSecret) {
      throw new Error("Missing Nomba credentials in environment.");
    }

    // 1. Fetch Fresh Access Token
    const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': accountId
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.data?.access_token) {
      throw new Error(`Nomba Auth Failed: ${authData.message || authData.description || "Unknown Error"}`);
    }

    const token = authData.data.access_token;

    if (action === 'GET_BANKS') {
      const response = await fetch('https://api.nomba.com/v1/transfers/banks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accountId': accountId
        }
      });
      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'VERIFY_ACCOUNT') {
      const { accountNumber, bankCode } = payload;

      const response = await fetch('https://api.nomba.com/v1/transfers/bank/lookup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accountId': accountId
        },
        body: JSON.stringify({
          accountNumber,
          bankCode
        })
      });

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
