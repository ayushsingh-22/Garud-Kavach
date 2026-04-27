import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { Card, CardContent } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Button } from "../Components/ui/button";
import { Label } from "../Components/ui/label";
import {
    UserPlus, Shield, Users, ArrowLeft,
    KeyRound, Briefcase, Calculator, UserCog,
} from "lucide-react";

// ─── Reusable form fields (name / email / password / confirm) ────────────────
// Rendered as plain JSX via a helper — NOT a nested component — so React
// preserves DOM nodes and input focus across re-renders.
const renderFormFields = ({ name, setName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword }) => (
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
            <Label htmlFor="email-address" className="text-slate-900 dark:text-white">Email address</Label>
            <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                placeholder="john@example.com"
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
);

// ─── Admin role definitions ──────────────────────────────────────────────────
const adminRoles = [
    { name: "Manager",  value: "manager",  icon: Briefcase,  description: "Manage queries and guards" },
    { name: "HR",       value: "hr",       icon: UserCog,    description: "Manage shifts, payroll, and leaves" },
    { name: "Finance",  value: "finance",  icon: Calculator,  description: "Manage invoices and expenses" },
];

// ─── Main component ─────────────────────────────────────────────────────────
const SignUpScreen = () => {
    // Step: 'choose-type' | 'customer-form' | 'security-code' | 'choose-role' | 'admin-form'
    const [step, setStep] = useState("choose-type");

    // Admin-specific state
    const [securityCode, setSecurityCode] = useState("");
    const [adminRole, setAdminRole] = useState("");

    // Shared form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI feedback
    const [msg, setMsg] = useState("");
    const [msgColor, setMsgColor] = useState("red");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // ── Navigation ───────────────────────────────────────────────────────────
    const handleBack = () => {
        setMsg("");
        const backMap = {
            "customer-form":  "choose-type",
            "security-code":  "choose-type",
            "choose-role":    "security-code",
            "admin-form":     "choose-role",
        };
        setStep(backMap[step] || "choose-type");
    };

    // ── Step C: verify security code against backend ─────────────────────────
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!securityCode.trim()) {
            setMsg("Security code is required");
            setMsgColor("red");
            return;
        }
        setIsLoading(true);
        setMsg("");

        try {
            // Probe: send a minimal request with the code. The backend checks the
            // code first, then validates adminRole — so a wrong code → 401,
            // while a correct code with empty adminRole → 400. Either non-401
            // status means the code was accepted.
            const res = await apiFetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountType:  "admin",
                    securityCode: securityCode,
                    adminRole:    "",
                    name:         "",
                    email:        "",
                    password:     "",
                }),
            });

            if (res.status === 401) {
                const data = await res.json();
                setMsgColor("red");
                setMsg(data.message || "Unauthorized access");
            } else {
                // Code accepted (got 400 for the deliberately empty role — expected)
                setStep("choose-role");
            }
        } catch {
            setMsgColor("red");
            setMsg("A network error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step B / E: submit registration ──────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");

        if (password.length < 8) {
            setMsgColor("red");
            setMsg("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setMsgColor("red");
            setMsg("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        const isAdmin = step === "admin-form";
        const payload = { name, email, password, accountType: isAdmin ? "admin" : "customer" };
        if (isAdmin) {
            payload.securityCode = securityCode;
            payload.adminRole    = adminRole;
        }

        try {
            const res = await apiFetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok) {
                setMsgColor("green");
                setMsg(data.message || "Account created! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else if (res.status === 401) {
                setMsgColor("red");
                setMsg(data.message || "Unauthorized access");
            } else {
                setMsgColor("red");
                setMsg(data.error || "Sign up failed");
            }
        } catch {
            setMsgColor("red");
            setMsg("A network error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Feedback banner ──────────────────────────────────────────────────────
    const feedbackBanner = msg ? (
        <div className={`mt-6 p-4 rounded-lg text-sm font-medium text-center ${
            msgColor === "green"
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        }`}>
            {msg}
        </div>
    ) : null;

    // ── Shared form field values ─────────────────────────────────────────────
    const fieldProps = { name, setName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword };

    // ── Render ───────────────────────────────────────────────────────────────
    const showBack = step !== "choose-type";

    let heading = "";
    let subtext = "";
    let content = null;

    switch (step) {
        // ─ Step A: Account type chooser ──────────────────────────────────────
        case "choose-type":
            heading = "Create your account";
            subtext  = "Choose your account type to get started";
            content = (
                <div className="mt-8 space-y-4">
                    <button
                        type="button"
                        onClick={() => setStep("customer-form")}
                        className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group"
                    >
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-500/20 transition-colors">
                            <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Customer</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Book and manage security services</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep("security-code")}
                        className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group"
                    >
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                            <Shield className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Admin</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Staff access with security code</p>
                        </div>
                    </button>
                </div>
            );
            break;

        // ─ Step B: Customer details form ─────────────────────────────────────
        case "customer-form":
            heading = "Create your account";
            subtext  = "Sign up to book and manage security services";
            content = (
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {renderFormFields(fieldProps)}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
                    >
                        {isLoading ? "Creating Account..." : (
                            <>
                                <UserPlus className="w-5 h-5 mr-2" />
                                Create Account
                            </>
                        )}
                    </Button>
                    {feedbackBanner}
                </form>
            );
            break;

        // ─ Step C: Security code entry ───────────────────────────────────────
        case "security-code":
            heading = "Admin Verification";
            subtext  = "Enter the admin security code to continue";
            content = (
                <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
                    <div className="space-y-2">
                        <Label htmlFor="securityCode" className="text-slate-900 dark:text-white">Security Code</Label>
                        <Input
                            id="securityCode"
                            name="securityCode"
                            type="password"
                            required
                            className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                            placeholder="Enter security code"
                            value={securityCode}
                            onChange={(e) => { setSecurityCode(e.target.value); setMsg(""); }}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
                    >
                        {isLoading ? "Verifying..." : (
                            <>
                                <KeyRound className="w-5 h-5 mr-2" />
                                Continue
                            </>
                        )}
                    </Button>
                    {feedbackBanner}
                </form>
            );
            break;

        // ─ Step D: Admin role chooser ────────────────────────────────────────
        case "choose-role":
            heading = "Select your role";
            subtext  = "Choose the role for your admin account";
            content = (
                <div className="mt-8 space-y-3">
                    {adminRoles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => { setAdminRole(role.value); setStep("admin-form"); }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-500/10 transition-colors">
                                    <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            );
            break;

        // ─ Step E: Admin details form (reuses same fields) ───────────────────
        case "admin-form": {
            const roleLabel = adminRole.charAt(0).toUpperCase() + adminRole.slice(1);
            heading = `Create ${roleLabel} Account`;
            subtext  = "Fill in your details to complete registration";
            content = (
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {renderFormFields(fieldProps)}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
                    >
                        {isLoading ? "Creating Account..." : (
                            <>
                                <UserPlus className="w-5 h-5 mr-2" />
                                Create Account
                            </>
                        )}
                    </Button>
                    {feedbackBanner}
                </form>
            );
            break;
        }

        default:
            break;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <Card className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white dark:bg-slate-900 border-0 shadow-xl dark:shadow-2xl">
                <CardContent className="p-0">
                    {showBack && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </button>
                    )}

                    <div className="flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg mb-6">
                            <img className="h-14 w-auto object-contain" src="/Logo4.png" alt="Garud Kavach Logo" />
                        </div>
                        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {heading}
                        </h2>
                        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                            {subtext}
                        </p>
                    </div>

                    {content}

                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
                        >
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUpScreen;
