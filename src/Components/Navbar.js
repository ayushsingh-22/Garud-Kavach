import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Sun, Moon, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    const activeLink = location.pathname;
    const isLoggedIn = !!user;

    const handleLinkClick = () => setMenuOpen(false);

    const handleLogout = () => {
        handleLinkClick();
        logout();
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const navLinks = [
        { path: '/',            label: 'Home' },
        { path: '/about-us',    label: 'About' },
        { path: '/our-services',label: 'Services' },
        { path: '/contact-us',  label: 'Contact' },
    ];

    const desktopLink = (path) =>
        `text-sm font-medium transition-colors duration-200 ${
            activeLink === path
                ? 'text-orange-600 dark:text-orange-500'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400'
        }`;

    const mobileLink = (path) =>
        `block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
            activeLink === path
                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`;

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" onClick={handleLinkClick} className="flex-shrink-0 flex items-center gap-2 bg-white rounded-lg p-1">
                        <img
                            src="/Logo4.png"
                            alt="Garud Kavach Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(({ path, label }) => (
                            <Link key={path} to={path} className={desktopLink(path)} onClick={handleLinkClick}>
                                {label}
                            </Link>
                        ))}
                        
                        <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {isLoggedIn ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/dashboard"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm shadow-orange-600/20"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-2 shadow-xl absolute w-full">
                    {navLinks.map(({ path, label }) => (
                        <Link key={path} to={path} className={mobileLink(path)} onClick={handleLinkClick}>
                            {label}
                        </Link>
                    ))}

                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                        {isLoggedIn ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-base font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-orange-600"
                                onClick={handleLinkClick}
                            >
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;