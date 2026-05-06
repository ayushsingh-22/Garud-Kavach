import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '../../utils/apiFetch';
import { useTheme } from '../../Components/ThemeProvider';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import {
    IndianRupee, TrendingUp, TrendingDown, Receipt, Wallet, ArrowUpRight,
    ArrowDownRight, Clock, Activity, BadgeCheck, FileText, Banknote,
    CircleDollarSign, AlertTriangle, ChevronRight, RefreshCw, Eye,
    PieChart as PieChartIcon, BarChart3, ArrowRight, CalendarDays,
    Filter, Search, ChevronLeft, X, CircleCheck, Minus
} from 'lucide-react';
import '../Styles/FinanceDashboard.css';

/* ─── Palette for pie chart ─────────────────────────────────────────── */
const PIE_COLORS = ['#f97316', '#10b981', '#3b82f6', '#a78bfa', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444'];

/* ─── Service (invoice) category colors ─────────────────────────────── */
const SERVICE_COLORS = {
    'Bouncer':              { bg: 'rgba(239,68,68,.12)',    color: '#f87171', border: 'rgba(239,68,68,.28)' },
    'Security Guard':      { bg: 'rgba(59,130,246,.12)',   color: '#60a5fa', border: 'rgba(59,130,246,.28)' },
    'Event Security':      { bg: 'rgba(245,158,11,.12)',   color: '#fbbf24', border: 'rgba(245,158,11,.28)' },
    'Corporate Security':  { bg: 'rgba(99,102,241,.12)',   color: '#818cf8', border: 'rgba(99,102,241,.28)' },
    'Residential Security':{ bg: 'rgba(16,185,129,.12)',   color: '#34d399', border: 'rgba(16,185,129,.28)' },
    'ATM Security':        { bg: 'rgba(249,115,22,.12)',   color: '#fb923c', border: 'rgba(249,115,22,.28)' },
    'VIP Protection':      { bg: 'rgba(168,85,247,.12)',   color: '#c084fc', border: 'rgba(168,85,247,.28)' },
    'Industrial Security': { bg: 'rgba(6,182,212,.12)',    color: '#22d3ee', border: 'rgba(6,182,212,.28)' },
    'Retail Security':     { bg: 'rgba(236,72,153,.12)',   color: '#f472b6', border: 'rgba(236,72,153,.28)' },
};
const DEFAULT_SVC = { bg: 'rgba(100,116,139,.12)', color: '#94a3b8', border: 'rgba(100,116,139,.28)' };

/* ─── Expense category colors ────────────────────────────────────────── */
const EXPENSE_COLORS = {
    'Salaries & Wages':       { bg: 'rgba(59,130,246,.12)',   color: '#60a5fa', border: 'rgba(59,130,246,.28)' },
    'Equipment & Gear':       { bg: 'rgba(6,182,212,.12)',    color: '#22d3ee', border: 'rgba(6,182,212,.28)' },
    'Vehicle & Transport':    { bg: 'rgba(245,158,11,.12)',   color: '#fbbf24', border: 'rgba(245,158,11,.28)' },
    'Training & Development': { bg: 'rgba(168,85,247,.12)',   color: '#c084fc', border: 'rgba(168,85,247,.28)' },
    'Maintenance & Repairs':  { bg: 'rgba(249,115,22,.12)',   color: '#fb923c', border: 'rgba(249,115,22,.28)' },
    'Office & Admin':         { bg: 'rgba(20,184,166,.12)',   color: '#2dd4bf', border: 'rgba(20,184,166,.28)' },
    'Utilities':              { bg: 'rgba(234,179,8,.12)',    color: '#facc15', border: 'rgba(234,179,8,.28)' },
    'Communication':          { bg: 'rgba(14,165,233,.12)',   color: '#38bdf8', border: 'rgba(14,165,233,.28)' },
    'Insurance':              { bg: 'rgba(99,102,241,.12)',   color: '#818cf8', border: 'rgba(99,102,241,.28)' },
    'Technology':             { bg: 'rgba(139,92,246,.12)',   color: '#a78bfa', border: 'rgba(139,92,246,.28)' },
    'Marketing':              { bg: 'rgba(236,72,153,.12)',   color: '#f472b6', border: 'rgba(236,72,153,.28)' },
    'Other':                  { bg: 'rgba(244,63,94,.12)',    color: '#fb7185', border: 'rgba(244,63,94,.28)' },
};

/* ─── Custom Tooltips ───────────────────────────────────────────────── */
const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ color: 'var(--tooltip-text)', fontSize: 10, marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
                </p>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ color: 'var(--tooltip-text)', fontSize: 10, marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>{p.name}</p>
            <p style={{ color: p.payload.fill || '#f97316', fontSize: 15, fontWeight: 700 }}>
                ₹{Number(p.value).toLocaleString('en-IN')}
            </p>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUPERADMIN FINANCE SECTION
═══════════════════════════════════════════════════════════════════════ */
const SuperAdminFinance = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    /* ── Theme-aware chart colors (SVG attrs don't support CSS vars) ── */
    const chartMuted = isDark ? '#94a3b8' : '#64748b';
    const chartGrid  = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [markingPaid, setMarkingPaid] = useState(null);

    /* ── Filter state ───────────────────────────────────────────────── */
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [trendMonths, setTrendMonths] = useState(6);
    const [txnType, setTxnType] = useState('all');       // all | invoice | expense
    const [txnStatus, setTxnStatus] = useState('all');   // all | paid | pending
    const [txnSearch, setTxnSearch] = useState('');       // client-side description search
    const [catScope, setCatScope] = useState('all');      // all | month

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                month: selectedMonth,
                trend_months: String(trendMonths),
                txn_type: txnType,
                txn_status: txnStatus,
                cat_scope: catScope,
            });
            const res = await apiFetch(`/api/finance/overview?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error('Finance overview fetch error:', e);
        }
        setLoading(false);
    }, [selectedMonth, trendMonths, txnType, txnStatus, catScope]);

    useEffect(() => {
        fetchOverview();
        const interval = setInterval(fetchOverview, 30000);
        return () => clearInterval(interval);
    }, [fetchOverview]);

    const handleMarkAsPaid = async (id) => {
        setMarkingPaid(id);
        try {
            const res = await apiFetch(`/api/finance/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' }),
            });
            if (res.ok) fetchOverview();
        } catch (e) {
            console.error(e);
        }
        setMarkingPaid(null);
    };

    if (loading && !data) {
        return (
            <div className="fd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                    <RefreshCw size={16} style={{ animation: 'fd-pulse 1.4s infinite' }} />
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>Loading finance data…</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const {
        revenue = 0, expenses = 0, profit = 0,
        trends = [], recent_transactions = [], category_breakdown = [],
        outstanding_amount = 0, outstanding_count = 0, total_collected = 0
    } = data;

    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
    const collectionRate = (revenue + outstanding_amount) > 0
        ? ((revenue / (revenue + outstanding_amount)) * 100).toFixed(0) : '0';

    /* ── Month nav helpers ──────────────────────────────────────────── */
    const shiftMonth = (dir) => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + dir, 1);
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const monthLabel = (() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    })();
    const isCurrentMonth = selectedMonth === (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    /* ── Client-side transaction search ─────────────────────────────── */
    const filteredTransactions = txnSearch
        ? recent_transactions.filter(t => t.description?.toLowerCase().includes(txnSearch.toLowerCase()))
        : recent_transactions;

    /* ── Shared filter pill style ────────────────────────────────────── */
    const pillStyle = (active) => ({
        fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        background: active ? 'rgba(240,165,0,.12)' : 'var(--surface2)',
        color: active ? 'var(--gold)' : 'var(--muted)',
        transition: 'all .2s ease', fontFamily: 'var(--font-mono)',
    });

    return (
        <div className="fd-root" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Global Month Filter Bar ───────────────────────────────── */}
            <div className="fd-panel fd-animate" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CalendarDays size={15} color="var(--gold)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Period</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                        <button onClick={() => shiftMonth(-1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                            <ChevronLeft size={14} />
                        </button>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 130, textAlign: 'center' }}>
                            {monthLabel}
                        </span>
                        <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: isCurrentMonth ? 'var(--faint)' : 'var(--muted)', opacity: isCurrentMonth ? 0.4 : 1 }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    {!isCurrentMonth && (
                        <button onClick={() => { const d = new Date(); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}
                            style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                            Today
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
                    <Filter size={11} />
                    <span>KPIs &amp; P&amp;L scoped to selected month</span>
                </div>
            </div>

            {/* ── KPI Cards Row ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {/* Revenue */}
                <div className="fd-kpi fd-animate fd-animate-d1">
                    <div className="top-bar" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                    <div style={{ padding: '20px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-dim)', border: '1px solid rgba(0,214,143,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IndianRupee size={15} color="var(--green)" />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <ArrowUpRight size={10} /> Revenue
                            </span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>This Month</p>
                        <h3 className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                            ₹{revenue.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>

                {/* Expenses */}
                <div className="fd-kpi fd-animate fd-animate-d2">
                    <div className="top-bar" style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                    <div style={{ padding: '20px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(255,85,85,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={15} color="var(--red)" />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', background: 'var(--red-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <ArrowDownRight size={10} /> Expense
                            </span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>This Month</p>
                        <h3 className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                            ₹{expenses.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="fd-kpi fd-animate fd-animate-d3">
                    <div className="top-bar" style={{ background: profit >= 0 ? 'linear-gradient(90deg,#f97316,#ea580c)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                    <div style={{ padding: '20px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: profit >= 0 ? 'var(--gold-dim)' : 'var(--red-dim)', border: `1px solid ${profit >= 0 ? 'rgba(240,165,0,.2)' : 'rgba(255,85,85,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {profit >= 0 ? <TrendingUp size={15} color="var(--gold)" /> : <TrendingDown size={15} color="var(--red)" />}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: profit >= 0 ? 'var(--gold)' : 'var(--red)', background: profit >= 0 ? 'var(--gold-dim)' : 'var(--red-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                {profit >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {profitMargin}%
                            </span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Net Profit</p>
                        <h3 className="mono" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: profit >= 0 ? 'var(--gold)' : 'var(--red)' }}>
                            ₹{Math.abs(profit).toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>

                {/* Outstanding */}
                <div className="fd-kpi fd-animate fd-animate-d4">
                    <div className="top-bar" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                    <div style={{ padding: '20px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={15} color="var(--amber)" />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--amber)', background: 'rgba(245,158,11,.12)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={10} /> {outstanding_count}
                            </span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Outstanding</p>
                        <h3 className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
                            ₹{outstanding_amount.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats Row ───────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                    { label: 'Total Collected', value: `₹${total_collected.toLocaleString('en-IN')}`, icon: CircleDollarSign, color: 'var(--green)' },
                    { label: 'Collection Rate', value: `${collectionRate}%`, icon: BadgeCheck, color: 'var(--gold)' },
                    { label: 'Profit Margin', value: `${profitMargin}%`, icon: Activity, color: profit >= 0 ? 'var(--gold)' : 'var(--red)' },
                    { label: 'Categories', value: category_breakdown.length, icon: PieChartIcon, color: '#a78bfa' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-mini">
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color={color} />
                        </div>
                        <div>
                            <p className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{value}</p>
                            <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts Row: Revenue Trend + Expense Breakdown ────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
                {/* 6-Month Trend */}
                <div className="fd-panel fd-animate fd-animate-d4">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart3 size={15} color="var(--gold)" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Revenue & Expense Trend</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[3, 6, 12].map(m => (
                                <button key={m} onClick={() => setTrendMonths(m)} style={pillStyle(trendMonths === m)}>
                                    {m}M
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 280, padding: '16px 12px 8px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false}
                                    tick={{ fill: chartMuted, fontSize: 11, fontFamily: "'Geist Variable', sans-serif", fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false}
                                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                    tick={{ fill: chartMuted, fontSize: 10, fontFamily: "'Geist Variable', monospace" }} />
                                <Tooltip content={<TrendTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={{ r: 3, fill: '#10b981' }} />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpense)" dot={{ r: 3, fill: '#ef4444' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Category Pie */}
                <div className="fd-panel fd-animate fd-animate-d5">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieChartIcon size={15} color="#a78bfa" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Expense Breakdown</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setCatScope('all')} style={pillStyle(catScope === 'all')}>All</button>
                            <button onClick={() => setCatScope('month')} style={pillStyle(catScope === 'month')}>Month</button>
                        </div>
                    </div>
                    {category_breakdown.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--muted)', fontSize: 13 }}>
                            No expense data
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                            <div style={{ height: 200, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={category_breakdown}
                                            dataKey="amount"
                                            nameKey="category"
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={80}
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {category_breakdown.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '0 16px' }}>
                                {category_breakdown.slice(0, 6).map((cat, i) => (
                                    <span key={cat.category} style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)'
                                    }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                                        {cat.category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Profit Trend (Bar Chart) ──────────────────────────────── */}
            <div className="fd-panel fd-animate">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                    <TrendingUp size={15} color="var(--gold)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Monthly Profit Trend</span>
                </div>
                <div style={{ height: 220, padding: '16px 12px 8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false}
                                tick={{ fill: chartMuted, fontSize: 11, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false}
                                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                tick={{ fill: chartMuted, fontSize: 10, fontFamily: "'Geist Variable', monospace" }} />
                            <Tooltip content={<TrendTooltip />} />
                            <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                {trends.map((entry, i) => (
                                    <Cell key={i} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Revenue vs Expense Ratio Bar ──────────────────────────── */}
            <div className="fd-panel fd-animate" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="sec-label" style={{ flex: 1, marginRight: 16 }}>Revenue vs Expense Ratio</span>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />Revenue</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />Expenses</span>
                    </div>
                </div>
                {(() => {
                    const revenueRatio = (revenue + expenses) > 0 ? (revenue / (revenue + expenses)) * 100 : 50;
                    return (
                        <>
                            <div className="ratio-bar">
                                {(revenue || expenses) ? (
                                    <>
                                        <div style={{ width: `${revenueRatio}%`, background: 'linear-gradient(90deg,#10b981,#059669)', transition: 'width .8s ease', borderRadius: '99px 0 0 99px' }} />
                                        <div style={{ width: `${100 - revenueRatio}%`, background: 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width .8s ease', borderRadius: '0 99px 99px 0' }} />
                                    </>
                                ) : (
                                    <div style={{ width: '100%', background: 'var(--faint)', borderRadius: 99 }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                                <span style={{ color: 'var(--green)' }}>₹{revenue.toLocaleString('en-IN')} <span style={{ color: 'var(--faint)' }}>({revenueRatio.toFixed(0)}%)</span></span>
                                <span style={{ color: 'var(--red)' }}>₹{expenses.toLocaleString('en-IN')} <span style={{ color: 'var(--faint)' }}>({(100 - revenueRatio).toFixed(0)}%)</span></span>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* ── Recent Transactions (15) ──────────────────────────────── */}
            <div className="fd-panel fd-animate">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Receipt size={15} color="var(--gold)" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent Transactions</span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            {filteredTransactions.length}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Type filter */}
                        <div style={{ display: 'flex', gap: 3 }}>
                            {['all', 'invoice', 'expense'].map(t => (
                                <button key={t} onClick={() => setTxnType(t)} style={pillStyle(txnType === t)}>
                                    {t === 'all' ? 'All' : t === 'invoice' ? 'Invoice' : 'Expense'}
                                </button>
                            ))}
                        </div>
                        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
                        {/* Status filter */}
                        <div style={{ display: 'flex', gap: 3 }}>
                            {['all', 'paid', 'pending'].map(s => (
                                <button key={s} onClick={() => setTxnStatus(s)} style={pillStyle(txnStatus === s)}>
                                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
                        {/* Search */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={12} style={{ position: 'absolute', left: 8, color: 'var(--faint)' }} />
                            <input
                                type="text"
                                value={txnSearch}
                                onChange={e => setTxnSearch(e.target.value)}
                                placeholder="Search…"
                                style={{
                                    fontSize: 11, padding: '5px 8px 5px 26px', borderRadius: 8, width: 140,
                                    border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)',
                                    fontFamily: 'var(--font-mono)', outline: 'none',
                                }}
                            />
                            {txnSearch && (
                                <button onClick={() => setTxnSearch('')} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex' }}>
                                    <X size={11} />
                                </button>
                            )}
                        </div>
                        <button onClick={fetchOverview} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead className="fd-table-head">
                            <tr>
                                {['Type', 'Description', 'Category', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '52px 0' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--faint)' }}>
                                        <Receipt size={32} />
                                        <p style={{ fontSize: 13, color: 'var(--muted)' }}>No transactions found</p>
                                    </div>
                                </td></tr>
                            ) : filteredTransactions.map((txn, i) => (
                                <tr key={`${txn.type}-${txn.id}-${i}`} className="fd-table-row">
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                                            letterSpacing: '.03em',
                                            background: txn.type === 'invoice' ? 'var(--green-dim)' : 'var(--red-dim)',
                                            color: txn.type === 'invoice' ? 'var(--green)' : 'var(--red)',
                                            border: `1px solid ${txn.type === 'invoice' ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
                                            textTransform: 'uppercase'
                                        }}>
                                            {txn.type === 'invoice' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                            {txn.type === 'invoice' ? 'Invoice' : 'Expense'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {txn.description || 'N/A'}
                                    </td>
                                    <td>{(() => {
                                        const palette = txn.type === 'invoice'
                                            ? (SERVICE_COLORS[txn.category] || DEFAULT_SVC)
                                            : (EXPENSE_COLORS[txn.category?.startsWith('Other') ? 'Other' : txn.category] || DEFAULT_SVC);
                                        const isOtherSub = txn.type !== 'invoice' && txn.category?.startsWith('Other: ');
                                        const catDisplay = isOtherSub
                                            ? <><span>Other</span><span style={{ opacity: .45, margin: '0 4px', fontWeight: 400 }}>·</span><span>{txn.category.slice(7)}</span></>
                                            : (txn.category || '—');
                                        return (
                                            <span style={{
                                                fontSize: 11, padding: '3px 10px', borderRadius: 6,
                                                background: palette.bg,
                                                border: `1px solid ${palette.border}`,
                                                color: palette.color,
                                                fontWeight: 600, whiteSpace: 'nowrap'
                                            }}>
                                                {catDisplay}
                                            </span>
                                        );
                                    })()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="mono" style={{
                                            fontWeight: 700,
                                            color: txn.type === 'invoice' ? 'var(--green)' : 'var(--red)'
                                        }}>
                                            {txn.type === 'invoice' ? '+' : '−'}₹{Number(txn.amount).toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`chip ${txn.status === 'paid' ? 'chip-paid' : 'chip-pending'}`}>
                                            <span className={`chip-dot ${txn.status === 'paid' ? 'chip-dot-paid' : 'chip-dot-pending'}`} />
                                            {txn.status === 'paid' ? 'Paid' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                                        {new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {txn.type === 'invoice' && txn.status === 'pending' ? (
                                            <button
                                                className="btn-mark-paid"
                                                disabled={markingPaid === txn.id}
                                                onClick={() => handleMarkAsPaid(txn.id)}
                                            >
                                                <BadgeCheck size={13} />
                                                {markingPaid === txn.id ? 'Updating…' : 'Mark Paid'}
                                            </button>
                                        ) : txn.type === 'invoice' ? (
                                            <span className="btn-settled">
                                                <CircleCheck size={12} />
                                                Settled
                                            </span>
                                        ) : (
                                            <span className="btn-na">
                                                <Minus size={11} />
                                                N/A
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Expense Category Details Table ────────────────────────── */}
            {category_breakdown.length > 0 && (
                <div className="fd-panel fd-animate">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                        <Banknote size={15} color="#a78bfa" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Expense by Category</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead className="fd-table-head">
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Category</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ textAlign: 'right' }}>Share</th>
                                    <th style={{ textAlign: 'left', width: '40%' }}>Distribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const totalCatAmt = category_breakdown.reduce((s, c) => s + c.amount, 0);
                                    return category_breakdown.map((cat, i) => {
                                        const pct = totalCatAmt > 0 ? ((cat.amount / totalCatAmt) * 100).toFixed(1) : 0;
                                        return (
                                            <tr key={cat.category} className="fd-table-row">
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cat.category}</span>
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>₹{cat.amount.toLocaleString('en-IN')}</span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{pct}%</span>
                                                </td>
                                                <td>
                                                    <div style={{ height: 6, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', width: `${pct}%`,
                                                            background: PIE_COLORS[i % PIE_COLORS.length],
                                                            borderRadius: 99, transition: 'width .6s ease'
                                                        }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Outstanding Invoices Summary ──────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="fd-panel fd-animate" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={18} color="var(--amber)" />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Outstanding Invoices</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{outstanding_count} invoice{outstanding_count !== 1 ? 's' : ''} pending payment</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                        <h3 className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
                            ₹{outstanding_amount.toLocaleString('en-IN')}
                        </h3>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>awaiting</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${(revenue + outstanding_amount) > 0 ? (outstanding_amount / (revenue + outstanding_amount)) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #f59e0b, #d97706)', transition: 'width .6s ease'
                        }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--faint)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                        {collectionRate}% collection rate this period
                    </p>
                </div>

                <div className="fd-panel fd-animate" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircleDollarSign size={18} color="var(--green)" />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Total Collections</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>All-time paid invoices</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                        <h3 className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>
                            ₹{total_collected.toLocaleString('en-IN')}
                        </h3>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>collected</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, width: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--faint)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                        Lifetime revenue across all invoices
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminFinance;
