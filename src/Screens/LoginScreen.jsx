import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { useAuth } from "../contexts/AuthContext";

const roleRoutes = {
  superadmin: "/dashboard", // or "/admin"
  manager: "/dashboard",    // or "/manager"
  finance: "/finance",
  hr: "/hr",
  customer: "/customer",
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgColor, setMsgColor] = useState("red");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, loading: authLoading } = useAuth();

  const from = location.state?.from?.pathname || "/";

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = roleRoutes[user.role] || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        // Fetch user details to get the role
        const userResponse = await apiFetch('/api/check-login');
        const userData = await userResponse.json();
        setUser(userData); // Update auth context

        setMsgColor("green");
        setMsg(data.message || "Login successful!");

        const redirectPath = roleRoutes[userData.role] || from;
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);

      } else {
        setMsgColor("red");
        setMsg(data.error || "Login failed");
      }
    } catch (err) {
      setMsgColor("red");
      setMsg("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl">
        <div className="flex flex-col items-center">
          <img className="h-20 w-auto" src="/Logo4.png" alt="Garud Kavach Logo" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm mt-1"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm mt-1"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
        {msg && (
          <p className={`text-center ${msgColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
        )}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-brand-dark hover:text-brand-gold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;