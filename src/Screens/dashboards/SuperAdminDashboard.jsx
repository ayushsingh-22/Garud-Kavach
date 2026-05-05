import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiFetch from "../../utils/apiFetch";
import QueryManagement from '../QueryManagement';
import GuardManagement from './GuardManagement';
import StaffManagement from './StaffManagement';
import AuditLog from './AuditLog';
import GuardTracking from './GuardTracking';
import LiveMapDashboard from './LiveMapDashboard';
import SuperAdminFinance from './SuperAdminFinance';
import { Card, CardContent } from "../../Components/ui/card";
import {
    ShieldAlert, Users, ClipboardList, LayoutDashboard, FileText, Activity,
    MapPin, Map, IndianRupee, TrendingUp, TrendingDown, Wallet, Receipt,
    CheckCircle2, Clock, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
    Briefcase, UserCheck, UserX, Shield, BarChart3, CircleDollarSign, CalendarDays, ChevronDown, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../Components/ThemeProvider';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const OverviewCard = ({ title, value, icon: Icon, trend, colorClass, subtitle }) => (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
        <CardContent className="p-5 flex items-center gap-4 h-full">
            <div className={`p-3.5 rounded-xl flex-shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</h3>
                    {trend && <span className={`text-[10px] font-semibold ${trend.startsWith('+') ? 'text-emerald-500' : trend.startsWith('-') ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>{trend}</span>}
                </div>
                {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate leading-tight">{subtitle}</p>}
            </div>
        </CardContent>
    </Card>
);

const MiniStat = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const StatusBar = ({ segments, height = 8 }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <div className={`w-full rounded-full bg-slate-100 dark:bg-slate-800`} style={{ height }} />;
    return (
        <div className="w-full rounded-full overflow-hidden flex" style={{ height }}>
            {segments.map((seg, i) => (
                <div key={i} className={seg.color} style={{ width: `${(seg.value / total) * 100}%`, transition: 'width .3s ease' }} />
            ))}
        </div>
    );
};

const DONUT_COLORS = ['#f97316', '#10b981', '#3b82f6', '#a78bfa', '#f59e0b', '#ec4899'];

const SuperAdminDashboard = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'overview');

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && section !== activeSection) {
            setActiveSection(section);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams]);

    const PERIOD_OPTIONS = [
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'last_3', label: 'Last 3 Months' },
        { value: 'last_6', label: 'Last 6 Months' },
        { value: 'all', label: 'All Time' },
    ];
    const [overviewPeriod, setOverviewPeriod] = useState('this_month');

    const [stats, setStats] = useState({
        totalQueries: 0,
        pendingRequests: 0,
        inProgressQueries: 0,
        resolvedQueries: 0,
        rejectedQueries: 0,
        totalRevenue: 0,
        activeGuards: 0,
        inactiveGuards: 0,
        onLeaveGuards: 0,
        totalGuards: 0,
        totalStaff: 0,
        staffByRole: {},
        serviceBreakdown: [],
        recentQueries: [],
    });

    const [finance, setFinance] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        outstandingAmount: 0,
        outstandingCount: 0,
        totalCollected: 0,
        trends: [],
        categoryBreakdown: [],
    });

    const fetchStats = useCallback(async () => {
        try {
            const now = new Date();
            // Compute finance month and query date cutoff based on period
            let financeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let queryCutoff = null;
            if (overviewPeriod === 'last_month') {
                financeMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                queryCutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            } else if (overviewPeriod === 'last_3') {
                queryCutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            } else if (overviewPeriod === 'last_6') {
                queryCutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            } else if (overviewPeriod === 'this_month') {
                queryCutoff = new Date(now.getFullYear(), now.getMonth(), 1);
            }
            // else 'all' → queryCutoff stays null, no filtering

            const monthStr = `${financeMonth.getFullYear()}-${String(financeMonth.getMonth() + 1).padStart(2, '0')}`;
            const trendMonths = overviewPeriod === 'last_6' || overviewPeriod === 'all' ? 6 : overviewPeriod === 'last_3' ? 3 : 2;

            const [queriesRes, guardsRes, staffRes, financeRes] = await Promise.all([
                apiFetch("/api/getAllQueries").then(res => res.json()),
                apiFetch("/api/guards").then(res => res.json()),
                apiFetch("/api/admin/users").then(res => res.json()),
                apiFetch(`/api/finance/overview?month=${monthStr}&trend_months=${trendMonths}`).then(res => res.ok ? res.json() : null).catch(() => null),
            ]);

            const allQueries = Array.isArray(queriesRes) ? queriesRes : [];
            const queries = queryCutoff
                ? allQueries.filter(q => q.submitted_at && new Date(q.submitted_at) >= queryCutoff)
                : allQueries;
            const guards = Array.isArray(guardsRes) ? guardsRes : [];
            const staff = Array.isArray(staffRes) ? staffRes : [];

            // Service breakdown
            const svcMap = {};
            queries.forEach(q => {
                if (q.service) svcMap[q.service] = (svcMap[q.service] || 0) + 1;
            });
            const serviceBreakdown = Object.entries(svcMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);

            // Staff role breakdown
            const roleMap = {};
            staff.forEach(u => {
                const role = u.role || 'unknown';
                roleMap[role] = (roleMap[role] || 0) + 1;
            });

            setStats({
                totalQueries: queries.length,
                pendingRequests: queries.filter(q => q.status === 'Pending').length,
                inProgressQueries: queries.filter(q => q.status === 'In Progress').length,
                resolvedQueries: queries.filter(q => q.status === 'Resolved').length,
                rejectedQueries: queries.filter(q => q.status === 'Rejected').length,
                totalRevenue: queries.reduce((s, q) => s + (q.cost || 0), 0),
                activeGuards: guards.filter(g => g.status === 'active').length,
                inactiveGuards: guards.filter(g => g.status === 'inactive').length,
                onLeaveGuards: guards.filter(g => g.status === 'on_leave').length,
                totalGuards: guards.length,
                totalStaff: staff.length,
                staffByRole: roleMap,
                serviceBreakdown,
                recentQueries: allQueries.slice(0, 5),
            });

            if (financeRes) {
                setFinance({
                    revenue: financeRes.revenue || 0,
                    expenses: financeRes.expenses || 0,
                    profit: financeRes.profit || 0,
                    outstandingAmount: financeRes.outstanding_amount || 0,
                    outstandingCount: financeRes.outstanding_count || 0,
                    totalCollected: financeRes.total_collected || 0,
                    trends: financeRes.trends || [],
                    categoryBreakdown: (financeRes.category_breakdown || []).slice(0, 5),
                });
            }
        } catch (error) {
            console.error("Error fetching overview stats:", error);
        }
    }, [overviewPeriod]);

    useEffect(() => {
        let intervalId;
        if (activeSection === 'overview') {
            fetchStats();
            intervalId = setInterval(fetchStats, 15000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [activeSection, fetchStats]);

    const navItems = [
        { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
        { id: 'queries',   label: 'Client Queries',  icon: ClipboardList },
        { id: 'guards',    label: 'Guard Management', icon: ShieldAlert },
        { id: 'tracking',  label: 'Live Tracking',    icon: MapPin },
        { id: 'map',       label: 'Live Map',         icon: Map },
        { id: 'staff',     label: 'Staff Management', icon: Users },
        { id: 'finance',   label: 'Finance',          icon: IndianRupee },
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
            case 'staff':
                return <StaffManagement />;
            case 'finance':
                return <SuperAdminFinance />;
            case 'audit':
                return <AuditLog />;
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        {/* ── Filter Bar ── */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Overview</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {PERIOD_OPTIONS.find(p => p.value === overviewPeriod)?.label} summary
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                    <select
                                        value={overviewPeriod}
                                        onChange={e => setOverviewPeriod(e.target.value)}
                                        className="appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
                                    >
                                        {PERIOD_OPTIONS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                                <button
                                    onClick={fetchStats}
                                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                    title="Refresh data"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Row 1: Primary KPIs ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <OverviewCard
                                title="Total Queries"
                                value={fmt(stats.totalQueries)}
                                icon={ClipboardList}
                                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500"
                                subtitle={`${stats.inProgressQueries} in progress · ${stats.resolvedQueries} resolved`}
                            />
                            <OverviewCard
                                title="Pending Requests"
                                value={fmt(stats.pendingRequests)}
                                icon={Clock}
                                colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
                                subtitle={stats.rejectedQueries > 0 ? `${stats.rejectedQueries} rejected` : 'Awaiting action'}
                            />
                            <OverviewCard
                                title="Active Guards"
                                value={fmt(stats.activeGuards)}
                                icon={ShieldAlert}
                                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                                subtitle={`${stats.totalGuards} total · ${stats.onLeaveGuards} on leave`}
                            />
                            <OverviewCard
                                title="Total Staff"
                                value={fmt(stats.totalStaff)}
                                icon={Users}
                                colorClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500"
                                subtitle={Object.entries(stats.staffByRole).map(([r, c]) => `${c} ${r}`).join(' · ') || 'No staff data'}
                            />
                        </div>

                        {/* ── Row 2: Finance KPIs ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <OverviewCard
                                title="Monthly Revenue"
                                value={fmtCurrency(finance.revenue)}
                                icon={TrendingUp}
                                colorClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500"
                                subtitle="Current month collections"
                            />
                            <OverviewCard
                                title="Monthly Expenses"
                                value={fmtCurrency(finance.expenses)}
                                icon={TrendingDown}
                                colorClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500"
                                subtitle="Current month spend"
                            />
                            <OverviewCard
                                title="Net Profit"
                                value={fmtCurrency(finance.profit)}
                                icon={Wallet}
                                trend={finance.revenue > 0 ? `${((finance.profit / finance.revenue) * 100).toFixed(0)}% margin` : undefined}
                                colorClass={finance.profit >= 0
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500"}
                                subtitle="Revenue minus expenses"
                            />
                            <OverviewCard
                                title="Outstanding"
                                value={fmtCurrency(finance.outstandingAmount)}
                                icon={AlertTriangle}
                                colorClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500"
                                subtitle={`${finance.outstandingCount} unpaid invoice${finance.outstandingCount !== 1 ? 's' : ''}`}
                            />
                        </div>

                        {/* ── Row 3: Status Breakdowns + Quick Stats ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Query Status Breakdown */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-blue-500" /> Query Status
                                    </h4>
                                    <StatusBar segments={[
                                        { value: stats.inProgressQueries, color: 'bg-blue-500' },
                                        { value: stats.resolvedQueries, color: 'bg-emerald-500' },
                                        { value: stats.pendingRequests, color: 'bg-amber-400' },
                                        { value: stats.rejectedQueries, color: 'bg-red-400' },
                                    ]} />
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 flex-1 items-start content-start">
                                        {[
                                            { label: 'In Progress', value: stats.inProgressQueries, dot: 'bg-blue-500' },
                                            { label: 'Resolved', value: stats.resolvedQueries, dot: 'bg-emerald-500' },
                                            { label: 'Pending', value: stats.pendingRequests, dot: 'bg-amber-400' },
                                            { label: 'Rejected', value: stats.rejectedQueries, dot: 'bg-red-400' },
                                        ].map(s => (
                                            <div key={s.label} className="flex items-center gap-1.5 text-xs">
                                                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guard Status Breakdown */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-500" /> Guard Roster
                                    </h4>
                                    <StatusBar segments={[
                                        { value: stats.activeGuards, color: 'bg-emerald-500' },
                                        { value: stats.onLeaveGuards, color: 'bg-amber-400' },
                                        { value: stats.inactiveGuards, color: 'bg-slate-300 dark:bg-slate-600' },
                                    ]} />
                                    <div className="grid grid-cols-3 gap-2 mt-3 flex-1">
                                        <div className="text-center py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex flex-col items-center justify-center">
                                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.activeGuards}</p>
                                            <p className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Active</p>
                                        </div>
                                        <div className="text-center py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex flex-col items-center justify-center">
                                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.onLeaveGuards}</p>
                                            <p className="text-[10px] font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">On Leave</p>
                                        </div>
                                        <div className="text-center py-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center">
                                            <p className="text-lg font-bold text-slate-600 dark:text-slate-300 tabular-nums">{stats.inactiveGuards}</p>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inactive</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Financial Quick Stats */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <CircleDollarSign className="w-4 h-4 text-orange-500" /> Financial Summary
                                    </h4>
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Total Collected (All Time)</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{fmtCurrency(finance.totalCollected)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Query Revenue (Costs)</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{fmtCurrency(stats.totalRevenue)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Collection Rate</span>
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {stats.totalRevenue > 0 ? `${((finance.totalCollected / stats.totalRevenue) * 100).toFixed(0)}%` : '—'}
                                            </span>
                                        </div>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Avg. Query Value</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {stats.totalQueries > 0 ? fmtCurrency(stats.totalRevenue / stats.totalQueries) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Row 4: Charts ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Revenue vs Expenses Trend */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-blue-500" /> Revenue vs Expenses
                                    </h4>
                                    {finance.trends.length > 0 ? (
                                        <div className="flex-1" style={{ minHeight: 200 }}>
                                            <ResponsiveContainer>
                                                <BarChart data={finance.trends} barGap={2} barSize={14}>
                                                    <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'} />
                                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                                    <Tooltip
                                                        contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 10, fontSize: 12 }}
                                                        labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
                                                        formatter={v => [fmtCurrency(v)]}
                                                    />
                                                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4,4,0,0]} />
                                                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center min-h-[200px]">
                                            <p className="text-sm text-slate-400 dark:text-slate-500">No trend data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Service Distribution */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-purple-500" /> Service Distribution
                                    </h4>
                                    {stats.serviceBreakdown.length > 0 ? (
                                        <div className="flex items-center gap-4 flex-1">
                                            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie data={stats.serviceBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                                                            {stats.serviceBreakdown.map((_, i) => (
                                                                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 10, fontSize: 12 }}
                                                            formatter={(v, name) => [`${v} queries`, name]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex-1 space-y-2 min-w-0">
                                                {stats.serviceBreakdown.map((svc, i) => (
                                                    <div key={svc.name} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{svc.name}</span>
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{svc.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center min-h-[200px]">
                                            <p className="text-sm text-slate-400 dark:text-slate-500">No service data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Row 5: Recent Queries + Expense Breakdown ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Recent Queries */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-amber-500" /> Recent Queries
                                        </h4>
                                        <button onClick={() => setActiveSection('queries')} className="text-xs font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                            View All →
                                        </button>
                                    </div>
                                    {stats.recentQueries.length > 0 ? (
                                    <div className="space-y-2 flex-1">
                                        {stats.recentQueries.map(q => (
                                            <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{q.name}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{q.service || 'No service'} · {q.numGuards || 0} guard{q.numGuards !== '1' ? 's' : ''}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                    q.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                                                    : q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                    : q.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                                }`}>{q.status}</span>
                                                {q.cost > 0 && <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums flex-shrink-0">{fmtCurrency(q.cost)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-sm text-slate-400 dark:text-slate-500">No recent queries</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Expense Category Breakdown */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 h-full">
                                <CardContent className="p-5 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-red-500" /> Top Expense Categories
                                    </h4>
                                    {finance.categoryBreakdown.length > 0 ? (
                                    <div className="space-y-3 flex-1">
                                            {finance.categoryBreakdown.map((cat, i) => {
                                                const maxAmt = finance.categoryBreakdown[0]?.amount || 1;
                                                return (
                                                    <div key={cat.category}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-slate-600 dark:text-slate-400">{cat.category}</span>
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{fmtCurrency(cat.amount)}</span>
                                                        </div>
                                                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                            <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-400" style={{ width: `${(cat.amount / maxAmt) * 100}%`, transition: 'width .3s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-sm text-slate-400 dark:text-slate-500">No expense data available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Superadmin Access</p>
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

export default SuperAdminDashboard;
