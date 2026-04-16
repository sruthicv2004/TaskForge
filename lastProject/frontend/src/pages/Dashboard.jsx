import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import TaskDetailModal from "../components/TaskDetailModal";
import useDebounce from "../hooks/useDebounce";

const fetchProjects = async (search, signal) => {
  const res = await API.get("projects/", { params: { search }, signal });
  return res.data;
};
const fetchTasks = async (signal) => {
  const res = await API.get("tasks/", { signal });
  return res.data;
};
const fetchAnalytics = async (signal) => {
  const res = await API.get("analytics/", { signal });
  return res.data;
};
const fetchUsers = async (signal) => {
  const res = await API.get("users/", { signal });
  return res.data;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: userInfo } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectData, setProjectData] = useState({ name: "", description: "", members: [] });

  const isAdmin = userInfo?.role?.toLowerCase() === "admin";
  const debouncedProjectSearch = useDebounce(projectSearch, 500);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", debouncedProjectSearch],
    queryFn: ({ signal }) => fetchProjects(debouncedProjectSearch, signal),
    enabled: !!userInfo,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-summary"],
    queryFn: ({ signal }) => fetchTasks(signal),
    enabled: !!userInfo,
    staleTime: 60_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: ({ signal }) => fetchAnalytics(signal),
    enabled: !!userInfo,
    staleTime: 60_000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => fetchUsers(signal),
    enabled: !!userInfo && isAdmin,
    staleTime: 120_000,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => API.post("projects/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setShowProjectModal(false);
      setProjectData({ name: "", description: "", members: [] });
      alert("Project created ");
    },
    onError: (err) => {
      alert("Error : " + JSON.stringify(err.response?.data || err.message));
    },
  });

  return (
    <Layout>
      <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome, {userInfo?.username}!</h1>
                <p className="text-gray-500">You are a member of {projects.length} active projects.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md text-sm"
                >
                  + New Project
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                  <h2 className="text-3x1 font-bold text-gray-700">My Projects</h2>
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text" 
                      placeholder="Search projects..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition shadow-sm"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {projects.length > 0 ? (
                  projects.map((project) => (
                      <div 
                        key={project.id} 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">Project</span>
                            <h3 className="font-bold text-gray-800 text-xl group-hover:text-blue-600 transition">{project.name}</h3>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{project.description}</p>
                        
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
                          <span className="text-xs font-bold text-gray-400">Created by: {project.created_by}</span>
                          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{project.members.length} Members</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                    {projectSearch ? "No projects match your search." : "No projects found."}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-800 mb-4 tracking-tight">Global Task Progress</h2>
                  <div className="space-y-3">
                    <StatItem label="Pending Tasks" count={tasks.filter(t => t.status === 'pending').length} color="blue" />
                    <StatItem label="In Progress" count={tasks.filter(t => t.status === 'in_progress').length} color="yellow" />
                    <StatItem label="Completed" count={tasks.filter(t => t.status === 'completed').length} color="green" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

     
      {showProjectModal && (
        <ProjectModal 
          projectData={projectData} 
          setProjectData={setProjectData} 
          allUsers={allUsers}
          onClose={() => setShowProjectModal(false)}
          onCreate={() => createProjectMutation.mutate(projectData)}
          isPending={createProjectMutation.isPending}
          currentUser={userInfo}
        />
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["tasks-summary"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
          }}
          currentUser={userInfo}
          projectMembers={isAdmin ? allUsers : []}
        />
      )}
    </Layout>
  );
}


function ProjectModal({ projectData, setProjectData, allUsers, onClose, onCreate, isPending, currentUser }) {
  const handleMembers = (id, checked) => {
    const userId = parseInt(id, 10);
    setProjectData(prev => ({
      ...prev,
      members: checked ? [...prev.members, userId] : prev.members.filter(m => m !== userId)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md p-8 rounded shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Project</h2>
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Project Name" 
            onChange={(e) => setProjectData({...projectData, name: e.target.value})}
          />
          <textarea 
            className="w-full px-4 py-3 bg-gray-50 border rounded outline-none h-24" 
            placeholder="Description..."
            onChange={(e) => setProjectData({...projectData, description: e.target.value})}
          />
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Invite Team</label>
            <div className="mt-2 border rounded p-3 max-h-32 overflow-y-auto space-y-2">
              {allUsers.filter(u => u.username !== currentUser?.username).map(u => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" onChange={(e) => handleMembers(u.id, e.target.checked)} />
                  {u.username}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
          <button 
            onClick={onCreate} 
            disabled={isPending}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded shadow-lg disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


function StatItem({ label, count, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    yellow: "text-amber-600 bg-amber-50 border-amber-100"
  };
  return (
    <div className={`flex justify-between items-center p-4 rounded border-2 ${colors[color]}`}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-xl font-black">{count}</span>
    </div>
  );
}