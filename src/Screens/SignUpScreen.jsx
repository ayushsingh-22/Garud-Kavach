import React, { useState, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react";
import { Card, CardContent } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Button } from "../Components/ui/button";
import { Label } from "../Components/ui/label";
import { UserPlus } from "lucide-react";

const roles = [
    { name: "Customer", value: "customer" },
    { name: "Manager", value: "manager" },
    { name: "Finance", value: "finance" },
    { name: "HR", value: "hr" },
    { name: "Super Admin", value: "superadmin" },
];

const SignUpScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState(roles[0]);
    const [msg, setMsg] = useState("");
    const [msgColor, setMsgColor] = useState("red");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles } = useFloating({
        placement: "bottom-start",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(5),
            flip(),
            shift({ padding: 10 }),
        ],
    });

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg("");

        try {
            const response = await apiFetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role: selectedRole.value }),
            });
            const data = await response.json();

            if (response.ok) {
                setMsgColor("green");
                setMsg("Sign up successful! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMsgColor("red");
                setMsg(data.error || "Sign up failed");
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
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                            Join us to manage your security needs
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-slate-900 dark:text-white">Role</Label>
                                <Listbox 
                                    value={selectedRole} 
                                    onChange={(value) => {
                                        setSelectedRole(value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="relative mt-1">
                                        <Listbox.Button
                                            ref={refs.setReference}
                                            onClick={() => setIsOpen(!isOpen)}
                                            className="relative w-full cursor-default rounded-md bg-slate-50 dark:bg-slate-950 py-3 pl-3 pr-10 text-left border border-slate-200 dark:border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300 sm:text-sm text-slate-900 dark:text-slate-100"
                                        >
                                            <span className="block truncate">{selectedRole.name}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-slate-400"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            show={isOpen}
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                            afterLeave={() => setIsOpen(false)}
                                        >
                                            <Listbox.Options
                                                ref={refs.setFloating}
                                                style={floatingStyles}
                                                className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-50 dark:bg-slate-800 py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 border border-slate-200 dark:border-slate-700 focus:outline-none sm:text-sm z-50"
                                            >
                                                {roles.map((role, roleIdx) => (
                                                    <Listbox.Option
                                                        key={roleIdx}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active ? "bg-slate-200 dark:bg-slate-700 text-orange-900 dark:text-orange-400" : "text-slate-900 dark:text-slate-200"
                                                            }`
                                                        }
                                                        value={role}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected ? "font-medium" : "font-normal"
                                                                    }`}
                                                                >
                                                                    {role.name}
                                                                </span>
                                                                {selected ? (
                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600 dark:text-orange-500">
                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base shadow-lg shadow-orange-600/20"
                        >
                            {isLoading ? "Creating Account..." : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Sign Up
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

export default SignUpScreen;
