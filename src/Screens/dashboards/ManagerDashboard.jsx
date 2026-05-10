import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiFetch from "../../utils/apiFetch";
import QueryManagement from '../QueryManagement';
import GuardManagement from './GuardManagement';
import AuditLog from './AuditLog';
import GuardTracking from './GuardTracking';
import LiveMapDashboard from './LiveMapDashboard';
import DashboardLayout from './DashboardLayout';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'overview');

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && section !== activeSection) {
            setActiveSection(section);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams]);
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
        <DashboardLayout
            navItems={navItems}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            title="Admin Panel"
            subtitle="Manager Access"
            pageDescription="Manage system records and configurations."
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default ManagerDashboard;
