// supabase/functions/invite-team-member/index.ts
// Deploy with: supabase functions deploy invite-team-member

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: object, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return json({ error: 'Unauthorized — no auth header' });

        // Identify the calling user
        const supUrl = Deno.env.get('SUPABASE_URL');
        const supKey = Deno.env.get('SUPABASE_ANON_KEY');
        if (!supUrl || !supKey) return json({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars' });

        const supabaseUser = createClient(supUrl, supKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) return json({ error: `Unauthorized — ${authError?.message || 'No user'}` });

        const reqBody = await req.json();
        const { email, name, role, password } = reqBody;
        if (!email || !name || !role || !password) return json({ error: 'email, name, role, and password are required' });

        const ownerId = user.id;

        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!serviceKey) return json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets' });

        const admin = createClient(supUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        let memberId = null;

        // Try creating user directly with auto-confirmed email
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        const alreadyRegistered = createError?.message?.toLowerCase().includes('already') ||
            createError?.message?.toLowerCase().includes('registered');

        if (createError && !alreadyRegistered) {
            return json({ error: `createUser failed: ${createError.message}` });
        }

        if (alreadyRegistered) {
            // Fetch their existing ID
            const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', email).single();
            if (!existingProfile) {
                // Try fetching directly from Auth API if missing from profiles view
                return json({ error: 'User is registered but their profile could not be found.' });
            }
            memberId = existingProfile.id;
        } else {
            memberId = createData.user.id;
            // The DB trigger handle_new_user() runs instantly on insert, but we give it 500ms guaranteed delay
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Clean up any stale team list invites
        const { error: delError } = await admin.from('team_members').delete().eq('owner_id', ownerId).eq('email', email);
        if (delError) return json({ error: `Delete stale member failed: ${delError.message}` });

        // Override their role on the internal Fleet IQ ledger
        const { error: profileError } = await admin.from('profiles').update({
            linked_owner_id: ownerId,
            team_role: role
        }).eq('id', memberId);

        if (profileError) {
            return json({ error: `Account created, but failed to link workspace profile: ${profileError.message}` });
        }

        const { error: insertError } = await admin.from('team_members').insert({
            owner_id: ownerId,
            member_user_id: memberId,
            name,
            email,
            role,
            status: 'Active', // Immediately Active
        });

        if (insertError) {
            return json({ error: `Insert onto team roster failed: ${insertError.message}` });
        }

        return json({ success: true });
    } catch (err: any) {
        return json({ error: `Fatal catch error: ${err?.message}\n${err?.stack}` });
    }
});
