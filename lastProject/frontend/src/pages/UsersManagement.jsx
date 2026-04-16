import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function UsersManagement() {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ['users'],
        queryFn: async ({ signal }) => {
            const res = await API.get('users/', { signal });
            return res.data;
        },
        enabled: isAdmin,
        staleTime: 120_000,
    });

    const filteredUsers = users.filter(u => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q)
        );
    });

    const deleteMutation = useMutation({
        mutationFn: (userId) => API.delete(`users/${userId}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            alert('User deleted successfully ');
        },
        onError: () => alert('Failed to delete user. Make sure you have the necessary permissions.'),
    });

    const handleDeleteUser = (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;
        deleteMutation.mutate(userId);
    };

    if (!isAdmin) return <Navigate to="/dashboard" />;

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">User Management</h1>
                        <p className="text-gray-500 mt-2 font-medium">Monitor team performance and task distribution across the workspace.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or email..."
                            className="w-72 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-sm font-medium"
                        />
                        <span className="absolute left-3 top-3 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-300 hover:text-gray-500 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Team Member</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">To-Do (Pending)</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">In Progress</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Completed</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Role</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-medium">Loading user data...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                                    {searchQuery ? `No users found for "${searchQuery}"` : 'No users found.'}
                                                </p>
                                                {searchQuery && (
                                                    <button onClick={() => setSearchQuery('')} className="text-indigo-500 text-xs font-bold mt-1 hover:underline">Clear search</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-blue-50/30 transition group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-m shadow-lg shadow-blue-200/50">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-italic text-gray-800 text-md">{u.username}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-50 text-blue-600 font-black text-m border border-blue-100">
                                                {u.task_stats?.pending || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-amber-50 text-amber-600 font-black text-m border border-amber-100">
                                                {u.task_stats?.in_progress || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-green-50 text-green-600 font-black text-m border border-green-100">
                                                {u.task_stats?.completed || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            {u.role !== 'admin' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                    disabled={deleteMutation.isPending}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                    title="Delete User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 ">
                    <SummaryCard title="Total Users" value={users.length} color="indigo" />
                    <SummaryCard title="Total Completed" value={users.reduce((acc, curr) => acc + (curr.task_stats?.completed || 0), 0)} color="green" />
                    <SummaryCard title="Active Work" value={users.reduce((acc, curr) => acc + (curr.task_stats?.in_progress || 0), 0)}  color="amber" />
                </div>
            </div>
        </Layout>
    );
}

function SummaryCard({ title, value, icon, color }) {
    const colors = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        green: "text-green-600 bg-green-50 border-green-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100"
    };
    return (
        <div className={`p-6 rounded border-2 shadow-sm flex items-center justify-between ${colors[color]}`}>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{title}</p>
                <p className="text-3xl font-black">{value}</p>
            </div>
            <div className="text-4xl">{icon}</div>
        </div>
    );
}
