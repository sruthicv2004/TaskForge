import { useState, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import TaskDetailModal from "../components/TaskDetailModal";
import useDebounce from "../hooks/useDebounce";

export default function MyTasks() {
  const { user: userInfo } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  const debouncedTaskSearch = useDebounce(taskSearch, 500);


  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ["my-tasks", debouncedTaskSearch, userInfo?.id],
    queryFn: async ({ signal }) => {
      const res = await API.get("tasks/", {
        params: { search: debouncedTaskSearch, assigned_to: userInfo?.id },
        signal,
      });
      return res.data.filter((t) => t.status !== "completed");
    },
    enabled: !!userInfo,
  });

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight">My Active Tasks</h1>
            <p className="text-gray-500 mt-2 font-medium">Keep track of all your ongoing assignments and updates.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search your tasks..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition shadow-sm font-medium"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <span className="absolute left-4 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {taskSearch && (
              <button
                onClick={() => setTaskSearch("")}
                className="absolute right-4 top-3.5 text-gray-300 hover:text-gray-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                    <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
                ))}
             </div>
        ) : tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-300 transition cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${task.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                        {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-blue-500 transition">#{task.id}</span>
                </div>
                
                <h3 className="font-black text-gray-800 text-lg group-hover:text-blue-600 transition mb-2">
                    {task.title}
                </h3>
                
                <div className="mb-4">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {task.project_name || "Unassigned Project"}
                    </span>
                </div>

                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                    {task.description || <span className="italic opacity-50">No description provided.</span>}
                </p>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                        <span className={`text-xs font-black uppercase ${task.priority === 'high' ? 'text-red-500' : 'text-gray-800'}`}>
                            {task.priority}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deadline</span>
                        <span className="text-xs font-bold text-gray-800 font-mono">
                            {task.due_date || "No Date"}
                        </span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
             <div className="text-5xl mb-4"></div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                 {taskSearch ? "No tasks match your search." : "You're all caught up! No active tasks."}
             </p>
             {taskSearch && (
               <button onClick={() => setTaskSearch("")} className="text-blue-500 text-sm font-bold mt-3 hover:underline">
                 Clear search
               </button>
             )}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["my-tasks"] })}
          currentUser={userInfo}
          projectMembers={[]} 
        />
      )}
    </Layout>
  );
}
