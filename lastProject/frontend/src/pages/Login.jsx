import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const handleLogin = async () => {
    const result = await login(credentials.username, credentials.password);
    if (result.success) {
      nav("/dashboard");
    } else {
      alert("Error : " + result.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans">
      <div className="w-96 bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Join <h1 className="text-red-500">TaskForge</h1></h2>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-400 text-sm mt-1">Login to manage your tasks</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          Login
        </button>

        <p className="text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <span className="text-blue-600 font-bold cursor-pointer" onClick={() => nav("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}