import React, { useState, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../utils/apiFetch";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl">
                <div className="flex flex-col items-center">
                    <img className="h-20 w-auto" src="/Logo4.png" alt="Garud Kavach Logo" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm mt-1"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                                autoComplete="new-password"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm mt-1"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
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
                                        className="relative w-full cursor-default rounded-md bg-white py-3 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                                    >
                                        <span className="block truncate">{selectedRole.name}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon
                                                className="h-5 w-5 text-gray-400"
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
                                            className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20"
                                        >
                                            {roles.map((role, roleIdx) => (
                                                <Listbox.Option
                                                    key={roleIdx}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                            active ? "bg-amber-100 text-amber-900" : "text-gray-900"
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
                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
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

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold"
                        >
                            {isLoading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </div>
                </form>
                {msg && (
                    <p className={`text-center ${msgColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
                )}
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-brand-dark hover:text-brand-gold">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpScreen;
