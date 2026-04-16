import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ActivityLogs() {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const { data: tasks = [], isLoading: loading } = useQuery({
        queryKey: ['activity-logs'],
        queryFn: async ({ signal }) => {
            const res = await API.get('tasks/', { signal });
            return res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        },
        enabled: isAdmin,
        staleTime: 60_000,
    });

    const filteredTasks = tasks.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.title?.toLowerCase().includes(q) ||
            t.project_name?.toLowerCase().includes(q) ||
            t.assigned_name?.toLowerCase().includes(q) ||
            t.status?.toLowerCase().includes(q)
        );
    });

    const deleteMutation = useMutation({
        mutationFn: (taskId) => API.delete(`tasks/${taskId}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            alert('Task deleted successfully ');
        },
        onError: () => alert('Failed to delete task. Make sure you have the necessary permissions.'),
    });

    const handleDeleteTask = (taskId, taskTitle) => {
        if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"? This cannot be undone.`)) return;
        deleteMutation.mutate(taskId);
    };

    if (!isAdmin) return <Navigate to="/dashboard" />;

    return (
        <Layout>
            <div className="p-8 max-w-[1600px] mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Activity Logs</h1>
                        <p className="text-gray-500 mt-2 font-medium">Audit all task creations, status updates, and history across the workspace.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search tasks, projects, users..."
                                className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm font-medium"
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
                        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                {searchQuery ? 'Results' : 'Total Logs'}
                            </span>
                            <span className="text-2xl font-black text-indigo-600">
                                {searchQuery ? `${filteredTasks.length} / ${tasks.length}` : tasks.length}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Task Details</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Project</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Assigned To</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Assigned By</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Assigned Date</th>
                                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-20 text-center text-gray-400 font-medium italic">Scanning activity logs...</td>
                                    </tr>
                                ) : filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                                    {searchQuery ? `No results for "${searchQuery}"` : 'No activity found in the logs.'}
                                                </span>
                                                {searchQuery && (
                                                    <button onClick={() => setSearchQuery('')} className="text-blue-500 text-xs font-bold mt-1 hover:underline">Clear search</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTasks.map((t) => (
                                    <tr key={t.id} className="hover:bg-blue-50/30 transition group">
                                        <td className="px-6 py-6">
                                            <div className="max-w-xs">
                                                <p className="font-bold text-gray-800 text-sm truncate" title={t.title}>{t.title}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic" title={t.description}>{t.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                {t.project_name || "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-gray-700 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-black uppercase">
                                                    {t.assigned_name?.charAt(0) || "U"}
                                                </div>
                                                {t.assigned_name || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-gray-500 text-xs italic">{t.created_by_name}</td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                t.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 font-mono text-[10px] text-red-500 font-bold">{t.due_date}</td>
                                        <td className="px-6 py-6 font-medium text-gray-500 text-[10px]">{new Date(t.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-6 text-right">
                                            <button 
                                                onClick={() => handleDeleteTask(t.id, t.title)}
                                                disabled={deleteMutation.isPending}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                title="Delete this entry"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
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
