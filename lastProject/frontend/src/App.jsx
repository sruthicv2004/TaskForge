import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Register from "./pages/Register";
import ProjectDetails from "./pages/ProjectDetails";
import UsersManagement from "./pages/UsersManagement";
import CompletedTasks from "./pages/CompletedTasks";
import ActivityLogs from "./pages/ActivityLogs";
import MyTasks from "./pages/MyTasks";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        } />
        
        <Route path="/projects/:id" element={
            <ProtectedRoute>
                <ProjectDetails />
            </ProtectedRoute>
        } />

        <Route path="/completed-tasks" element={
            <ProtectedRoute>
                <CompletedTasks />
            </ProtectedRoute>
        } />
        
        <Route path="/kanban" element={
            <ProtectedRoute>
                <Kanban />
            </ProtectedRoute>
        } />

        <Route path="/users" element={
            <ProtectedRoute>
                <UsersManagement />
            </ProtectedRoute>
        } />
        <Route path="/activity-log" element={
            <ProtectedRoute>
                <ActivityLogs />
            </ProtectedRoute>
        } />
        <Route path="/my-tasks" element={
            <ProtectedRoute>
                <MyTasks />
            </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}