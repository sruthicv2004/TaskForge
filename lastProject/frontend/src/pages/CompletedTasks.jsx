import React, { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../api/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

export default function CompletedTasks() {
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const { data: tasks = [], isLoading: loading } = useQuery({
        queryKey: ['completed-tasks', user?.id, isAdmin],
        queryFn: async ({ signal }) => {
            const params = { status: 'completed' };
            if (!isAdmin) params.assigned_to = user.id;
            const res = await API.get('tasks/', { params, signal });
            return res.data;
        },
        enabled: !!user,
        staleTime: 60_000,
    });

    const filteredTasks = tasks.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.title?.toLowerCase().includes(q) ||
            t.project_name?.toLowerCase().includes(q) ||
            t.assigned_name?.toLowerCase().includes(q)
        );
    });

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Completed Tasks</h1>
                        <p className="text-gray-500 mt-2 font-medium">Review your finished work and achievements.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search completed tasks..."
                            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition shadow-sm font-medium"
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
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Task Details</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Project</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Assigned</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Completed At</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Team Member</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Assigner</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-medium italic">Finding your completed works...</td>
                                    </tr>
                                ) : filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                                    {searchQuery ? `No results for "${searchQuery}"` : 'No completed tasks yet. Keep pushing!'}
                                                </p>
                                                {searchQuery && (
                                                    <button onClick={() => setSearchQuery('')} className="text-green-500 text-xs font-bold mt-1 hover:underline">Clear search</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTasks.map((t) => (
                                    <tr key={t.id} className="hover:bg-green-50/30 transition group">
                                        <td className="px-6 py-6">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition">{t.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                        {t.priority}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono italic">#{t.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-sm font-black text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                                {t.project_name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 font-medium text-gray-500 text-xs">
                                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-xs font-black text-green-600">
                                                {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'Pending'}
                                                <p className="text-[10px] text-green-400 font-bold uppercase">{t.completed_at ? new Date(t.completed_at).toLocaleTimeString() : ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                    {t.assigned_name?.[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{t.assigned_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-[10px] font-bold text-gray-400 block mb-1">Created by:</span>
                                            <span className="text-xs font-black text-indigo-600">{t.created_by_name}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
