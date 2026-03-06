import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import { decode as decodeBase58 } from "https://deno.land/std@0.168.0/encoding/base58.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { address, message, signature } = await req.json()

        if (!address || !message || !signature) {
            throw new Error('Missing required fields: address, message, signature')
        }

        // 1. Verify the signature
        const messageBytes = new TextEncoder().encode(message)
        let signatureBytes: Uint8Array;

        if (Array.isArray(signature)) {
            signatureBytes = new Uint8Array(signature);
        } else if (typeof signature === 'string') {
            try {
                signatureBytes = decodeBase58(signature);
            } catch (e) {
                throw new Error('Invalid signature format.');
            }
        } else {
            throw new Error('Invalid signature format.');
        }

        const publicKeyBytes = decodeBase58(address)
        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!verified) {
            throw new Error('Invalid signature')
        }

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Check if user exists or create new one
        // We use a deterministic email for the wallet address to link it to auth.users
        const email = `${address}@solana.fleetiq.com`;
        let userId = '';

        // Note: listUsers() paginates and might miss users on large databases, 
        // but for safety we will first try to create the user, and if it fails due to existing email, 
        // we'll look them up directly via an RPC or query, or just use the admin API cautiously.
        // A more robust way in Supabase is to just attempt to get the user via admin API:

        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            console.error("Error listing users:", listError);
        }

        const existingUser = users?.users?.find(u => u.email === email);

        if (existingUser) {
            userId = existingUser.id;
        } else {
            // Attempt to create new user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: {
                    wallet_address: address,
                    full_name: `Wallet ${address.slice(0, 4)}...${address.slice(-4)}`,
                    avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=ef4444`
                }
            });

            if (createError) {
                if (createError.message.includes('already exists') || createError.message.includes('already registered')) {
                    // In case pagination missed them, but creation still caught it.
                    const { data: fallbackSearch } = await supabaseAdmin.from('auth.users').select('id').eq('email', email).single();
                    if (fallbackSearch) {
                        userId = fallbackSearch.id;
                    } else {
                        throw new Error("User exists but could not retrieve ID.");
                    }
                } else {
                    throw createError;
                }
            } else {
                userId = newUser.user.id;
            }
        }

        // 4. Generate Custom JWT
        // We manually mint a JWT that Supabase Auth will accept.
        // It must be signed with the project's JWT Secret.
        const jwtSecret = Deno.env.get('JWT_SECRET');

        if (!jwtSecret) {
            console.error('Missing JWT_SECRET environment variable');
            throw new Error('Server configuration error: Missing JWT Secret');
        }

        // Construct the payload required by Supabase (GoTrue)
        const payload = {
            aud: 'authenticated',
            exp: getNumericDate(60 * 60 * 24 * 7), // 7 days
            sub: userId,
            email: email,
            role: 'authenticated',
            user_metadata: {
                wallet_address: address
            }
        };

        // Create the token using the HS256 algorithm and the signing key
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(jwtSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"]
        );

        const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Wallet verified and authenticated',
                token: token,
                user: {
                    id: userId,
                    email: email,
                    wallet_address: address
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error occurred' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
