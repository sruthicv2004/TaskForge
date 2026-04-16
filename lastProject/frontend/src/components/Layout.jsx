import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user: userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = userInfo?.role?.toLowerCase() === "admin";
  const firstLetter = userInfo?.username?.charAt(0).toUpperCase() || "?";

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans">
      <nav className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center shadow-sm z-[60]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          
          <div className="text-2xl font-extrabold text-red-600 tracking-tight">TaskForge</div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-l pl-6">
            <p className="hidden sm:block text-sm font-bold text-gray-800">
              {userInfo?.username || "Loading..."}
            </p>
            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold border-2 border-blue-200 text-sm md:text-base">
              {firstLetter}
            </div>
            <button 
              onClick={handleLogout} 
              className="text-gray-500 hover:text-red-500 transition text-[11px] md:text-[13px] font-black uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-400 text-gray-900 font-bold text-[15px] p-6 
          transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex justify-between items-center md:block mb-8">
            <p className="text-[13px] font-bold text-gray-600 uppercase tracking-widest">Workspace</p>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-700 hover:text-black">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>

          <nav className="space-y-1">
            <SidebarLink to="/dashboard" onClick={() => setSidebarOpen(false)}>Dashboard</SidebarLink>
            {!isAdmin && <SidebarLink to="/my-tasks" onClick={() => setSidebarOpen(false)}>My Tasks</SidebarLink>}
            {!isAdmin && <SidebarLink to="/kanban" onClick={() => setSidebarOpen(false)}>Status</SidebarLink>}
            {isAdmin && <SidebarLink to="/users" onClick={() => setSidebarOpen(false)}>Users</SidebarLink>}
            <SidebarLink to="/completed-tasks" onClick={() => setSidebarOpen(false)}>Completed Tasks</SidebarLink>
            {isAdmin && <SidebarLink to="/activity-log" onClick={() => setSidebarOpen(false)}>Activity Logs</SidebarLink>}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ to, children, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="block w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-sm font-black tracking-tight"
    >
      {children}
    </Link>
  );
}
