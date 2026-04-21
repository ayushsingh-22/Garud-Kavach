import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiFetch from "../utils/apiFetch";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();

    const activeLink = location.pathname;

    const handleLinkClick = () => setMenuOpen(false);

    const checkLoginStatus = async () => {
        try {
            const response = await apiFetch("/api/check-login", {
                method: 'GET',
            });
            setIsLoggedIn(response.ok);
        } catch {
            setIsLoggedIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch("/api/logout", { method: "POST" });
        } catch {
            // Intentionally swallow errors to ensure the UI still transitions to logged-out state.
        }
        setIsLoggedIn(false);
        window.location.href = '/';
    };

    useEffect(() => { checkLoginStatus(); }, [location]);

    const navLinks = [
        { path: '/',            label: 'Home' },
        { path: '/about-us',    label: 'About' },
        { path: '/our-services',label: 'Services' },
        { path: '/contact-us',  label: 'Contact' },
        ...(isLoggedIn ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    ];

    /* Desktop link style */
    const desktopLink = (path) =>
        `text-sm font-medium pb-1 border-b-2 transition-colors duration-200 ${
            activeLink === path
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-400'
        }`;

    /* Mobile link style */
    const mobileLink = (path) =>
        `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
            activeLink === path
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
        }`;

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">

                    {/* Logo — anchored to the left */}
                    <Link to="/" onClick={handleLinkClick} className="flex-shrink-0">
                        <img
                            src="/Logo4.png"
                            alt="Rakshak Service Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </Link>

                    {/* Right-side group — pushed to the far right with ml-auto */}
                    <div className="ml-auto flex items-center">

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-7">
                            {navLinks.map(({ path, label }) => (
                                <Link key={path} to={path} className={desktopLink(path)} onClick={handleLinkClick}>
                                    {label}
                                </Link>
                            ))}

                            {isLoggedIn ? (
                                <button
                                    onClick={handleLogout}
                                    className="ml-1 px-5 py-1.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-sm"
                                >
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={handleLinkClick}
                                    className="ml-1 px-5 py-1.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                                >
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            className="md:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle navigation menu"
                        >
                            {menuOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
                    {navLinks.map(({ path, label }) => (
                        <Link key={path} to={path} className={mobileLink(path)} onClick={handleLinkClick}>
                            {label}
                        </Link>
                    ))}

                    <div className="pt-2 border-t border-gray-100">
                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className={mobileLink('/login')}
                                onClick={handleLinkClick}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;