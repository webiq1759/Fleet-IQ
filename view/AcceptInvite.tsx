import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

export const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const ownerId = searchParams.get('ownerId');
    const role = searchParams.get('role');

    useEffect(() => {
        const setupMembership = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !ownerId || !role) {
                navigate('/login');
                return;
            }

            // Set linked_owner_id and team_role in the member's profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    linked_owner_id: ownerId,
                    team_role: role,
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Error setting up team membership:', profileError);
            }

            // Update team_members row status to Active and link member_user_id
            await supabase
                .from('team_members')
                .update({
                    member_user_id: user.id,
                    status: 'Active',
                })
                .eq('owner_id', ownerId)
                .eq('email', user.email);

            // Log the accept action
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('full_name, company_name')
                .eq('id', ownerId)
                .single();

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                user_name: user.email,
                owner_id: ownerId,
                action: 'Accepted team invite',
                target: ownerProfile?.company_name || ownerProfile?.full_name || 'Workspace',
            });

            navigate('/dashboard');
        };

        setupMembership();
    }, [ownerId, role, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Setting up your workspace access…</p>
            </div>
        </div>
    );
};
