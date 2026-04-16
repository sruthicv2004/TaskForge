import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user", 
  });

  const { register } = useContext(AuthContext);
  const nav = useNavigate();

  const handleRegister = async () => {
    const result = await register(data.username, data.email, data.password, data.role);
    if (result.success) {
      alert("Account created successfully! ");
      nav("/dashboard");
    } else {
      alert("Error : " + result.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans">
      <div className="w-96 bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 bg-blue-600 rounded-xl mb-4 flex items-center justify-center text-white font-bold italic text-2xl">J</div>
          <h2 className="text-2xl font-bold text-red-500">Join TaskForge</h2>
          <p className="text-gray-400 text-sm mt-1">Create your workspace account</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setData({ ...data, username: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Account Type</label>
            <select
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-600"
              value={data.role}
              onChange={(e) => setData({ ...data, role: e.target.value })}
            >
              <option value="user">Standard User (Team Member)</option>
              <option value="admin">Admin (Project Manager)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          Create Account
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <span className="text-blue-600 font-bold cursor-pointer" onClick={() => nav("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}