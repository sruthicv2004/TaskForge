import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, roleRequired }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="h-screen flex items-center justify-center p-10 font-bold text-gray-500">Loading Session...</div>;
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    if (roleRequired && user.role !== roleRequired) {
        return <Navigate to="/dashboard" />;
    }

    return children;
}
