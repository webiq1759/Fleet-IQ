
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Loader2, RefreshCw, UserCheck, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { AddTeamMemberModal } from '../../components/AddTeamMemberModal';
import { supabase } from '../../supabaseClient';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Invited' | 'Active' | 'Disabled';
    created_at: string;
    isOwner?: boolean;
}

interface AuditLog {
    id: string;
    user_name: string;
    action: string;
    target: string;
    created_at: string;
}

const statusBadge = (status: string) => {
    if (status === 'Active') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center gap-1 w-max"><UserCheck className="w-3 h-3" />Active</span>;
    if (status === 'Invited') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center gap-1 w-max"><Clock className="w-3 h-3" />Invited</span>;
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" />Disabled</span>;
};

export const Team = () => {
    const [activeTab, setActiveTab] = useState<'members' | 'logs'>('members');
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; email: string } | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [logSearch, setLogSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    useEffect(() => {
        fetchOwnerAndMembers();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') fetchAuditLogs();
    }, [activeTab]);

    const fetchOwnerAndMembers = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoading(false); return; }

        // Get owner profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', user.id)
            .single();

        setOwnerInfo({
            name: profile?.company_name || profile?.full_name || 'Owner',
            email: user.email || '',
        });

        // Fetch team members from DB
        const { data: rows } = await supabase
            .from('team_members')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        setMembers(rows || []);
        setIsLoading(false);
    };

    const fetchAuditLogs = async () => {
        setIsLogsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLogsLoading(false); return; }

        const { data: logs } = await supabase
            .from('audit_logs')
            .select('id, user_name, action, target, created_at')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        setAuditLogs(logs || []);
        setIsLogsLoading(false);
    };

    const handleRemoveMember = async (id: string) => {
        if (!confirm('Remove this team member? They will lose access to your workspace.')) return;
        await supabase.from('team_members').delete().eq('id', id);
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const filteredLogs = auditLogs.filter(l =>
        logSearch === '' ||
        l.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.user_name?.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.target?.toLowerCase().includes(logSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage access and view audit trails.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'members' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >Team Members</button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >Audit Logs</button>
                </div>
            </div>

            {activeTab === 'members' ? (
                <div className="space-y-8">
                    {/* Workspace Owner */}
                    {ownerInfo && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Workspace Owner</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-lg">
                                    {ownerInfo.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
                                        {ownerInfo.name}
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">Team Lead</span>
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{ownerInfo.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Table */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff Members</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={fetchOwnerAndMembers} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 transition-colors" title="Refresh">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Member
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Date Added</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {members.map(member => (
                                                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{statusBadge(member.status)}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                                        {new Date(member.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Remove Member"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {members.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-14 text-center">
                                                        <p className="text-slate-500 dark:text-slate-400">No team members added yet.</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Add Member" to invite your first staff member.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Audit Logs Tab */
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 items-center bg-slate-50 dark:bg-slate-800/50">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search logs by user, action, or target..."
                                value={logSearch}
                                onChange={e => setLogSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-red-500 dark:text-white"
                            />
                        </div>
                        <button onClick={fetchAuditLogs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 transition-colors" title="Refresh">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {isLogsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Target</th>
                                        <th className="px-6 py-4 text-right">Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{log.user_name || '—'}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{log.action}</td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.target || '—'}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-14 text-center text-slate-500 dark:text-slate-400">
                                                {logSearch ? 'No logs match your search.' : 'No audit logs recorded yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <AddTeamMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={fetchOwnerAndMembers} />
        </div>
    );
};
