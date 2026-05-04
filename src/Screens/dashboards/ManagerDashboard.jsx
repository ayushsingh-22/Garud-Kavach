import React, { useState, useEffect } from 'react';
import apiFetch from "../../utils/apiFetch";
import QueryManagement from '../QueryManagement';
import GuardManagement from './GuardManagement';
import AuditLog from './AuditLog';
import GuardTracking from './GuardTracking';
import LiveMapDashboard from './LiveMapDashboard';
import { Card, CardContent } from "../../Components/ui/card";
import { ShieldAlert, Users, ClipboardList, CheckCircle, LayoutDashboard, FileText, Activity, MapPin, Map } from 'lucide-react';

const OverviewCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
        <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                    {trend && <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-emerald-500' : trend.startsWith('-') ? 'text-red-500' : 'text-slate-500'}`}>{trend}</span>}
                </div>
            </div>
        </CardContent>
    </Card>
);

const ManagerDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [stats, setStats] = useState({
        activeQueries: 0,
        pendingRequests: 0,
        guardsOnDuty: 0,
        resolvedThisWeek: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [queriesRes, guardsRes] = await Promise.all([
                    apiFetch("/api/getAllQueries").then(res => res.json()),
                    apiFetch("/api/guards").then(res => res.json())
                ]);

                const queries = Array.isArray(queriesRes) ? queriesRes : [];
                const guards = Array.isArray(guardsRes) ? guardsRes : [];
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                setStats({
                    activeQueries: queries.filter(q => q.status === 'In Progress').length,
                    pendingRequests: queries.filter(q => q.status === 'Pending').length,
                    guardsOnDuty: guards.filter(g => g.status === 'active').length,
                    resolvedThisWeek: queries.filter(q =>
                        q.status === 'Resolved' && new Date(q.submitted_at) >= sevenDaysAgo
                    ).length
                });
            } catch (error) {
                console.error("Error fetching overview stats:", error);
            }
        };

        let intervalId;
        if (activeSection === 'overview') {
            fetchStats();
            intervalId = setInterval(fetchStats, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeSection]);

    const navItems = [
        { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
        { id: 'queries',   label: 'Client Queries',  icon: ClipboardList },
        { id: 'guards',    label: 'Guard Management', icon: ShieldAlert },
        { id: 'tracking',  label: 'Live Tracking',    icon: MapPin },
        { id: 'map',       label: 'Live Map',         icon: Map },
        { id: 'audit',     label: 'Audit Logs',       icon: FileText },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'queries':
                return <QueryManagement />;
            case 'guards':
                return <GuardManagement />;
            case 'tracking':
                return <GuardTracking />;
            case 'map':
                return <LiveMapDashboard />;
            case 'audit':
                return <AuditLog />;
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <OverviewCard
                                title="Active Queries"
                                value={stats.activeQueries}
                                icon={ClipboardList}
                                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500"
                            />
                            <OverviewCard
                                title="Pending Requests"
                                value={stats.pendingRequests}
                                icon={Activity}
                                colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
                            />
                            <OverviewCard
                                title="Guards on Duty"
                                value={stats.guardsOnDuty}
                                icon={Users}
                                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                            />
                            <OverviewCard
                                title="Resolved This Week"
                                value={stats.resolvedThisWeek}
                                icon={CheckCircle}
                                colorClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500"
                            />
                        </div>
                        <div className="relative z-10">
                            <QueryManagement />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Panel</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manager Access</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeSection === item.id
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="md:hidden w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 absolute z-10">
                <select
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                >
                    {navItems.map(item => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                </select>
            </div>

            <main className="flex-1 min-w-0 overflow-y-auto pt-20 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="mb-8 hidden md:block">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {navItems.find(i => i.id === activeSection)?.label}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system records and configurations.</p>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ManagerDashboard;
