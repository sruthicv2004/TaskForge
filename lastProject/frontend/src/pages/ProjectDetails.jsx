import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import TaskDetailModal from '../components/TaskDetailModal';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskSearch, setTaskSearch] = useState('');

  const isAdmin = user?.role?.toLowerCase() === 'admin';


  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async ({ signal }) => {
      const res = await API.get(`projects/${id}/`, { signal });
      return res.data;
    },
    retry: (count, err) => err?.response?.status === 404 ? false : count < 2,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: async ({ signal }) => {
      const res = await API.get('tasks/', { params: { project: id }, signal });
      return res.data;
    },
    enabled: !!project,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      const res = await API.get('users/', { signal });
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 120_000,
  });

 
  const filteredTasks = tasks.filter(t => {
    if (!taskSearch.trim()) return true;
    const q = taskSearch.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assigned_name?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q) ||
      t.priority?.toLowerCase().includes(q)
    );
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => API.post('tasks/', { ...data, project: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
      setShowTaskModal(false);
      setTaskData({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    },
    onError: () => alert('Error creating task.'),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => API.put(`projects/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowEditProjectModal(false);
    },
    onError: () => alert('Error updating project.'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => API.delete(`projects/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/dashboard');
    },
    onError: () => alert('Error deleting project.'),
  });

  const handleDeleteProject = () => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this project? This will delete all associated tasks.')) {
      deleteProjectMutation.mutate();
    }
  };

  const [editProjectData, setEditProjectData] = useState({ name: '', description: '', members: [] });

  useEffect(() => {
    if (project) {
      setEditProjectData({ name: project.name, description: project.description, members: project.members || [] });
    }
  }, [project]);

  if (projectLoading || tasksLoading) return <Layout><div className="p-10 font-bold text-gray-500 text-center">Loading Project...</div></Layout>;
  if (!project) return null;

  return (
    <Layout>
      <div className="p-10 max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex gap-3 items-center mb-2">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">{project.name}</h1>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Project ID: {project.id}</span>
            </div>
            <p className="text-gray-500 max-w-2xl">{project.description}</p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-3 mt-4 md:mt-0">
              <button 
                onClick={() => setShowEditProjectModal(true)}
                className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm text-sm"
              >
                Edit
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
                className="bg-red-50 text-red-600 px-5 py-2 rounded-xl font-bold hover:bg-red-100 transition shadow-sm border border-red-100 text-sm disabled:opacity-60"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </header>

        <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3">Project Team</h3>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {project.member_details && project.member_details.map((m) => (
                            <div key={m.id} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md" title={m.username}>
                                {m.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    {isAdmin && (
                        <button 
                            onClick={() => setShowEditProjectModal(true)}
                            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-md font-bold text-xl ml-2"
                            title="Add/Manage Members"
                        >
                            +
                        </button>
                    )}
                    {!project.member_details?.length && <span className="text-gray-400 text-sm font-medium">No team members assigned.</span>}
                </div>
            </div>
            {isAdmin && (
                <button 
                    onClick={() => setShowTaskModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 flex items-center gap-2"
                >
                    + Assign New Task
                </button>
            )}
        </div>

        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                Project Tasks
                <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-lg text-xs">
                  {taskSearch ? `${filteredTasks.length} / ${tasks.length}` : tasks.length}
                </span>
              </h2>
              {tasks.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-60 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm font-medium"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  {taskSearch && (
                    <button onClick={() => setTaskSearch('')} className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    {taskSearch ? (
                      <>
                        <p className="text-gray-400 font-bold mb-2">No tasks match &ldquo;{taskSearch}&rdquo;.</p>
                        <button onClick={() => setTaskSearch('')} className="text-blue-500 text-sm font-bold hover:underline">Clear search</button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 font-bold mb-2">No tasks assigned yet.</p>
                        {isAdmin && <p className="text-sm text-gray-300">Click '+ Assign New Task' above to get started.</p>}
                      </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => setSelectedTask(task)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group cursor-pointer hover:border-blue-200"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${task.priority === 'high' ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-50'}`}>
                                    {task.priority} Priority
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg mb-2">{task.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-4">{task.description}</p>
                            
                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                                        {task.assigned_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">{task.assigned_name || 'Unassigned'}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">{task.due_date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Assign Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(taskData); }} className="space-y-4">
              <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium" placeholder="Task Title" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
              <textarea required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 h-24 font-medium" placeholder="Task Description" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-600" value={taskData.priority} onChange={e => setTaskData({...taskData, priority: e.target.value})}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input required type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm text-gray-600 font-bold" value={taskData.due_date} onChange={e => setTaskData({...taskData, due_date: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Assign To Team Member</label>
                <select required className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-700" value={taskData.assigned_to} onChange={e => setTaskData({...taskData, assigned_to: e.target.value})}>
                    <option value="">Select a member...</option>
                    {project.member_details && project.member_details.map(m => (
                        <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:text-gray-600 transition">Cancel</button>
                <button type="submit" disabled={createTaskMutation.isPending} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-60">
                  {createTaskMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Edit Project Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); updateProjectMutation.mutate(editProjectData); }} className="space-y-4">
              <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Project Name" value={editProjectData.name} onChange={e => setEditProjectData({...editProjectData, name: e.target.value})} />
              <textarea required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 h-24 font-medium" placeholder="Description" value={editProjectData.description} onChange={e => setEditProjectData({...editProjectData, description: e.target.value})} />
              
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Update Member Access</label>
                <div className="mt-2 border border-gray-100 bg-gray-50 rounded-xl p-4 max-h-32 overflow-y-auto space-y-3">
                  {allUsers.filter(u => u.username !== user?.username).map(u => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={editProjectData.members.includes(u.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onChange={(e) => {
                            const val = parseInt(u.id);
                            setEditProjectData(prev => ({
                                ...prev,
                                members: e.target.checked ? [...prev.members, val] : prev.members.filter(m => m !== val)
                            }));
                        }} 
                      />
                      <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{u.username}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:text-gray-600 transition">Cancel</button>
                <button type="submit" disabled={updateProjectMutation.isPending} className="flex-1 py-3 bg-gray-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition disabled:opacity-60">
                  {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
          }}
          currentUser={user}
          projectMembers={project.member_details || []}
        />
      )}
    </Layout>
  );
}
