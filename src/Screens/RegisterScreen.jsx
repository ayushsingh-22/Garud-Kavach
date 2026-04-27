import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { Card, CardContent } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Button } from "../Components/ui/button";
import { Label } from "../Components/ui/label";
import { UserPlus } from "lucide-react";

const RegisterScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [msgColor, setMsgColor] = useState("red");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg("");

        if (password.length < 8) {
            setMsgColor("red");
            setMsg("Password must be at least 8 characters.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setMsgColor("red");
            setMsg("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiFetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                setMsgColor("green");
                setMsg(data.message || "Account created! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMsgColor("red");
                setMsg(data.error || "Registration failed");
            }
        } catch (err) {
            setMsgColor("red");
            setMsg("A network error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <Card className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white dark:bg-slate-900 border-0 shadow-xl dark:shadow-2xl">
                <CardContent className="p-0">
                    <div className="flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg mb-6">
                            <img className="h-14 w-auto object-contain" src="/Logo4.png" alt="Garud Kavach Logo" />
                        </div>
                        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Create an Account
                        </h2>
                        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                            Sign up to book and manage security services
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-900 dark:text-white">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-900 dark:text-white">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                                    placeholder="you@example.com"
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
                                    autoComplete="new-password"
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500">Minimum 8 characters</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-900 dark:text-white">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
                        >
                            {isLoading ? "Creating account..." : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Create Account
                                </>
                            )}
                        </Button>
                    </form>

                    {msg && (
                        <div className={`mt-6 p-4 rounded-lg text-sm font-medium text-center ${
                            msgColor === 'green'
                                ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        }`}>
                            {msg}
                        </div>
                    )}

                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-500 dark:hover:text-orange-400 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterScreen;
