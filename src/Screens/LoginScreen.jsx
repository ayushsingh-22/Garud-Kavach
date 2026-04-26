import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Button } from "../Components/ui/button";
import { Label } from "../Components/ui/label";
import { LogIn } from "lucide-react";

const roleRoutes = {
  superadmin: "/admin",
  manager: "/manager",
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

  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = roleRoutes[user.role] || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate]);

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
        const userResponse = await apiFetch('/api/check-login');
        const userData = await userResponse.json();
        setUser(userData);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="animate-pulse text-slate-500 dark:text-slate-400 font-medium">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Card className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white dark:bg-slate-900 border-0 shadow-xl dark:shadow-2xl">
        <CardContent className="p-0">
            <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg mb-6">
                <img className="h-14 w-auto object-contain" src="/Logo4.png" alt="Garud Kavach Logo" />
            </div>
            <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome Back
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                Please sign in to your account
            </p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
                <div className="space-y-2">
                <Label htmlFor="email-address" className="text-slate-900 dark:text-white">Email address</Label>
                <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900 dark:text-white">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
            >
                {isLoading ? "Signing in..." : (
                    <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In
                    </>
                )}
            </Button>
            </form>

            {msg && (
            <div className={`mt-6 p-4 rounded-lg text-sm font-medium text-center ${msgColor === 'green' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                {msg}
            </div>
            )}
            
            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-500 dark:hover:text-orange-400 transition-colors">
                Sign Up
            </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;