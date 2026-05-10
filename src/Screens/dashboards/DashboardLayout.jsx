import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';

const STORAGE_KEY = 'gk-sidebar-collapsed';

const DashboardLayout = ({
    navItems,
    activeSection,
    setActiveSection,
    title,
    subtitle,
    pageDescription,
    headerExtra,
    sidebarFooter,
    children,
    className = '',
}) => {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch {}
    }, [collapsed]);

    // Close mobile drawer on section change
    useEffect(() => { setMobileOpen(false); }, [activeSection]);

    const activeItem = navItems.find(i => i.id === activeSection);
    const resolvedDescription = activeItem?.desc || pageDescription;

    return (
        <div className={`flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-950 ${className}`}>
            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Desktop sidebar ── */}
            <aside
                className={`
                    ${collapsed ? 'w-[68px]' : 'w-64'}
                    transition-all duration-300 ease-in-out
                    bg-white dark:bg-slate-900
                    border-r border-slate-200 dark:border-slate-800
                    hidden md:flex flex-col flex-shrink-0
                `}
            >
                {/* Header */}
                <div className={`border-b border-slate-100 dark:border-slate-800 ${collapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
                    {collapsed ? (
                        <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto">
                            <span className="text-orange-600 dark:text-orange-500 font-bold text-sm">
                                {title?.charAt(0) || 'D'}
                            </span>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                        </>
                    )}
                </div>

                {/* Nav items */}
                <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto transition-all duration-300`}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            title={collapsed ? item.label : undefined}
                            className={`
                                w-full flex items-center gap-3
                                ${collapsed ? 'justify-center px-2' : 'px-4'} py-3
                                text-sm font-medium rounded-lg transition-colors
                                ${activeSection === item.id
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${
                                activeSection === item.id
                                    ? 'text-orange-600 dark:text-orange-500'
                                    : 'text-slate-400 dark:text-slate-500'
                            }`} />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {!collapsed && item.count > 0 && (
                                <span className="ml-auto text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Sidebar footer + collapse toggle */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
                    {!collapsed && sidebarFooter}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className={`
                            w-full flex items-center gap-3
                            ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5
                            text-sm font-medium rounded-lg transition-colors
                            text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800
                        `}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed
                            ? <PanelLeft className="w-5 h-5" />
                            : <PanelLeftClose className="w-5 h-5" />
                        }
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* ── Mobile slide-out drawer ── */}
            <aside
                className={`
                    fixed top-0 left-0 z-40 h-full w-72
                    bg-white dark:bg-slate-900
                    border-r border-slate-200 dark:border-slate-800
                    transform transition-transform duration-300 ease-in-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:hidden flex flex-col
                `}
            >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveSection(item.id); setMobileOpen(false); }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3
                                text-sm font-medium rounded-lg transition-colors
                                ${activeSection === item.id
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${
                                activeSection === item.id
                                    ? 'text-orange-600 dark:text-orange-500'
                                    : 'text-slate-400 dark:text-slate-500'
                            }`} />
                            <span>{item.label}</span>
                            {item.count > 0 && (
                                <span className="ml-auto text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                {sidebarFooter && (
                    <div className="border-t border-slate-100 dark:border-slate-800 p-3">
                        {sidebarFooter}
                    </div>
                )}
            </aside>

            {/* ── Main content area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar with hamburger */}
                <div className="md:hidden flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {activeItem?.label}
                    </h1>
                </div>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto">
                        <div className="mb-8 hidden md:block">
                            {headerExtra ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {activeItem?.label}
                                        </h1>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1">{resolvedDescription}</p>
                                    </div>
                                    {headerExtra}
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {activeItem?.label}
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">{resolvedDescription}</p>
                                </>
                            )}
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
