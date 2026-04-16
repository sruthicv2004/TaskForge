import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

export default function Kanban() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['kanban-tasks', user?.id],
    queryFn: async ({ signal }) => {
      const res = await API.get('tasks/', { signal });
      return res.data;
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }) => API.patch(`tasks/${taskId}/`, { status: newStatus }),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban-tasks', user?.id] });
      const previous = queryClient.getQueryData(['kanban-tasks', user?.id]);
      queryClient.setQueryData(['kanban-tasks', user?.id], old =>
        old.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['kanban-tasks', user?.id], context.previous);
      alert('Failed to update status. Reverting...');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks', user?.id] });
    },
  });

  const columns = ['pending', 'in_progress', 'completed'];

  return (
    <Layout>
      <div className="p-8 h-full flex flex-col">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Status Board</h1>
          <p className="text-gray-500">Manage tasks across your workflow columns.</p>
        </header>

        {loading ? (
           <div className="p-10 text-center text-gray-500 font-bold">Loading board...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[calc(100vh-200px)]">
            {columns.map((status) => (
              <div key={status} className="bg-gray-100 p-4 rounded flex flex-col border border-gray-200 shadow-inner">
                <h3 className="uppercase text-[11px] font-black text-gray-400 mb-4 tracking-[0.1em] px-2 flex justify-between">
                  {status.replace('_', ' ')}
                  <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded">{tasks.filter(t => t.status === status).length}</span>
                </h3>

                <div className="space-y-4 flex-1">
                  {tasks
                    .filter((t) => t.status === status)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-4 rounded shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              task.priority === 'high'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-gray-300 text-[10px] font-mono group-hover:text-blue-400">
                            #{task.id}
                          </span>
                        </div>

                        <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600">
                          {task.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex flex-col gap-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                  {task.assigned_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600">
                                  {task.assigned_name || 'Unassigned'}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">{task.due_date}</span>
                          </div>
                          
                          <div className="pt-2">
                            <select 
                              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-400"
                              value={task.status}
                              onChange={(e) => updateStatusMutation.mutate({ taskId: task.id, newStatus: e.target.value })}
                            >
                                <option value="pending">Move to Pending</option>
                                <option value="in_progress">Move to In Progress</option>
                                <option value="completed">Move to Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {tasks.filter((t) => t.status === status).length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                      <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Drop / Empty</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}