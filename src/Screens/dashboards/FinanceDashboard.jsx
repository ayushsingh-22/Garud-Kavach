import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiFetch from "../../utils/apiFetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../Components/ui/table";
import { Badge } from "../../Components/ui/badge";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Label } from "../../Components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../Components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
    IndianRupee, TrendingUp, TrendingDown, Receipt, Wallet, Calendar,
    LayoutDashboard, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
    Plus, CircleDot, Clock, Activity, BadgeCheck, FileText, Search,
    Sparkles, Eye, MoreHorizontal, Filter, PieChart, ShieldCheck, Banknote,
    Zap, CircleCheck, Users
} from 'lucide-react';
import { useTheme } from '../../Components/ThemeProvider';
import '../Styles/FinanceDashboard.css';

/* ─── Service (invoice) color map ──────────────────────────────────────────── */
const SERVICE_COLORS = {
    'Bouncer':               { bg: 'rgba(239,68,68,.12)',    color: '#f87171', border: 'rgba(239,68,68,.28)' },
    'Security Guard':        { bg: 'rgba(59,130,246,.12)',   color: '#60a5fa', border: 'rgba(59,130,246,.28)' },
    'Event Security':        { bg: 'rgba(245,158,11,.12)',   color: '#fbbf24', border: 'rgba(245,158,11,.28)' },
    'Corporate Security':    { bg: 'rgba(99,102,241,.12)',   color: '#818cf8', border: 'rgba(99,102,241,.28)' },
    'Residential Security':  { bg: 'rgba(16,185,129,.12)',   color: '#34d399', border: 'rgba(16,185,129,.28)' },
    'ATM Security':          { bg: 'rgba(249,115,22,.12)',   color: '#fb923c', border: 'rgba(249,115,22,.28)' },
    'VIP Protection':        { bg: 'rgba(168,85,247,.12)',   color: '#c084fc', border: 'rgba(168,85,247,.28)' },
    'Industrial Security':   { bg: 'rgba(6,182,212,.12)',    color: '#22d3ee', border: 'rgba(6,182,212,.28)' },
    'Retail Security':       { bg: 'rgba(236,72,153,.12)',   color: '#f472b6', border: 'rgba(236,72,153,.28)' },
};
const DEFAULT_SVC = { bg: 'rgba(100,116,139,.12)', color: '#94a3b8', border: 'rgba(100,116,139,.28)' };

/* ─── Expense categories (canonical list) ────────────────────────────────────── */
const EXPENSE_CATEGORIES = [
    'Salaries & Wages',
    'Equipment & Gear',
    'Vehicle & Transport',
    'Training & Development',
    'Maintenance & Repairs',
    'Office & Admin',
    'Utilities',
    'Communication',
    'Insurance',
    'Technology',
    'Marketing',
    'Other',
];

/* ─── Expense category color map ─────────────────────────────────────────────── */
const CAT_COLORS = {
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
const DEFAULT_CAT = { bg: 'rgba(100,116,139,.12)', color: '#94a3b8', border: 'rgba(100,116,139,.28)' };

/* ─── Custom Tooltip ─────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, padding: '10px 14px', fontFamily: "'Geist Variable', monospace" }}>
            <p style={{ color: 'var(--tooltip-text)', fontSize: 10, marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: p.fill === '#10b981' ? '#10b981' : '#ef4444', fontSize: 15, fontWeight: 700 }}>
                ₹{Number(p.value).toLocaleString('en-IN')}
            </p>
        </div>
    );
};

/* ─── Shared detail field helper ───────────────────────────────────────────── */
const DetailField = ({ label, value, mono = false, accent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{
            fontSize: 13, fontWeight: 600,
            color: accent || 'var(--text)',
            fontFamily: mono ? 'var(--font-mono)' : "'Geist Variable', sans-serif",
            lineHeight: 1.4
        }}>{value ?? '—'}</span>
    </div>
);

const DetailDivider = ({ label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
);

const BoolBadge = ({ label, value }) => (
    <span style={{
        fontSize: 11, padding: '4px 11px', borderRadius: 8, fontWeight: 600,
        background: value ? 'rgba(16,185,129,.12)' : 'rgba(100,116,139,.07)',
        color: value ? 'var(--green)' : 'var(--muted)',
        border: `1px solid ${value ? 'rgba(16,185,129,.28)' : 'var(--border)'}`,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: "'Geist Variable', sans-serif",
    }}>
        <span style={{ fontSize: 9 }}>{value ? '✓' : '✗'}</span>{label}
    </span>
);

/* ─── Invoice Detail ─────────────────────────────────────────────────────── */
const InvoiceDetailContent = ({ data: d }) => {
    const svc = SERVICE_COLORS[d.service] || DEFAULT_SVC;
    return (
        <div>
            {/* Orange accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--gold), #f59e0b)' }} />

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Invoice Detail</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-.01em', marginBottom: 10 }}>
                            INV-{d.id.toString().padStart(4, '0')}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`chip ${d.status === 'paid' ? 'chip-paid' : 'chip-pending'}`}>
                                <span className={`chip-dot ${d.status === 'paid' ? 'chip-dot-paid' : 'chip-dot-pending'}`} />
                                {d.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                            {d.service && (
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: svc.bg, border: `1px solid ${svc.border}`, color: svc.color, fontFamily: "'Geist Variable', sans-serif" }}>
                                    {d.service}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Amount</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>₹{Number(d.amount).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '4px 24px 24px' }}>
                <DetailDivider label="Invoice Details" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px', marginBottom: 4 }}>
                    <DetailField label="Issued Date" value={d.issued_at ? new Date(d.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} mono />
                    <DetailField label="Paid Date" value={d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet paid'} mono accent={d.paid_at ? undefined : 'var(--amber)'} />
                    <DetailField label="Payment Ref" value={d.payment_ref} mono />
                </div>

                {(d.client_name || d.client_email || d.client_phone) && (<>
                    <DetailDivider label="Client Information" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px', marginBottom: 4 }}>
                        <DetailField label="Name" value={d.client_name} />
                        <DetailField label="Email" value={d.client_email} mono />
                        <DetailField label="Phone" value={d.client_phone} mono />
                    </div>
                </>)}

                {d.query_id && (<>
                    <DetailDivider label="Service Request" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px', marginBottom: 4 }}>
                        <DetailField label="Query ID" value={`#${d.query_id}`} mono />
                        <DetailField label="Guards" value={d.num_guards ?? '—'} />
                        <DetailField label="Duration" value={d.duration_value ? `${d.duration_value} ${d.duration_type || ''}`.trim() : null} />
                    </div>
                    {d.message && (
                        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', margin: '16px 0 8px' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Message</p>
                            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontFamily: "'Geist Variable', sans-serif" }}>{d.message}</p>
                        </div>
                    )}
                    <DetailDivider label="Equipment Requirements" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                            ['Camera', d.camera_required],
                            ['Vehicle', d.vehicle_required],
                            ['First Aid', d.first_aid],
                            ['Walkie Talkie', d.walkie_talkie],
                            ['Bullet Proof', d.bullet_proof],
                            ['Fire Safety', d.fire_safety],
                        ].map(([label, val]) => <BoolBadge key={label} label={label} value={val} />)}
                    </div>
                </>)}
            </div>
        </div>
    );
};

/* ─── Expense Detail ─────────────────────────────────────────────────────── */
const ExpenseDetailContent = ({ data: d }) => {
    const catKey = d.category?.startsWith('Other') ? 'Other' : d.category;
    const cc = CAT_COLORS[catKey] || DEFAULT_CAT;
    return (
        <div>
            {/* Red accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Expense Detail</div>
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 700, background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color, fontFamily: "'Geist Variable', sans-serif" }}>
                            {d.category || 'Uncategorized'}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Amount</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: 'var(--red)', lineHeight: 1 }}>−₹{Number(d.amount).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '4px 24px 24px' }}>
                <DetailDivider label="Details" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 4 }}>
                    <DetailField label="Expense Date" value={d.expense_date} mono />
                    <DetailField label="Recorded At" value={d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null} mono />
                </div>
                {d.description && (
                    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', margin: '16px 0 4px' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Description</p>
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontFamily: "'Geist Variable', sans-serif" }}>{d.description}</p>
                    </div>
                )}
                <DetailDivider label="Recorded By" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                    <DetailField label="Name" value={d.added_by_name || 'System'} />
                    <DetailField label="Email" value={d.added_by_email} mono />
                </div>
            </div>
        </div>
    );
};

/* ─── Payroll Detail ─────────────────────────────────────────────────────── */
const PayrollDetailContent = ({ data: d }) => {
    const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
    const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
    const SHIFT_COLORS = { completed: '#10b981', scheduled: '#f59e0b', missed: '#ef4444', cancelled: '#94a3b8' };
    return (
        <div>
            {/* Green accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Payroll Detail</div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10, fontFamily: "'Geist Variable', sans-serif", letterSpacing: '-.01em' }}>{d.guard_name || 'Guard'}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`chip ${d.status === 'paid' ? 'chip-paid' : 'chip-pending'}`}>
                                <span className={`chip-dot ${d.status === 'paid' ? 'chip-dot-paid' : 'chip-dot-pending'}`} />
                                {d.status === 'paid' ? 'Disbursed' : 'Pending'}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--muted)', padding: '3px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)' }}>{d.month}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Total Pay</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>₹{Number(d.total_pay).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '4px 24px 24px' }}>
                <DetailDivider label="Summary" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px', marginBottom: 4 }}>
                    <DetailField label="Actual Hours" value={`${d.total_hours} hrs`} mono />
                    <DetailField label="Overtime Hrs" value={d.overtime_hours > 0 ? `+${d.overtime_hours} hrs` : '—'} mono accent={d.overtime_hours > 0 ? '#f59e0b' : undefined} />
                    <DetailField label="Billable Hrs" value={`${(d.total_hours || 0) + (d.overtime_hours || 0)} hrs`} mono accent='#10b981' />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 6, marginBottom: 2, letterSpacing: '.04em' }}>
                    Billable = Actual + Overtime &nbsp;·&nbsp; Pay = Billable × Rate
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px 20px', marginTop: 14, marginBottom: 4 }}>
                    <DetailField label="Rate / Hr" value={`₹${Number(d.rate_per_hour).toLocaleString('en-IN')}`} mono />
                    <DetailField label="Guard ID" value={`#${d.guard_id}`} mono />
                </div>
                {(d.guard_phone || d.guard_email) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginTop: 14 }}>
                        <DetailField label="Phone" value={d.guard_phone} mono />
                        <DetailField label="Email" value={d.guard_email} mono />
                    </div>
                )}

                <DetailDivider label={`Working Schedule (${d.shifts.length} shift${d.shifts.length !== 1 ? 's' : ''})`} />
                {d.shifts.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0', fontFamily: "'Geist Variable', sans-serif" }}>No shifts recorded for this period.</p>
                ) : (
                    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: 'var(--surface2)' }}>
                                    {['Date', 'Start', 'End', 'Actual', 'OT', 'Billable', 'Client', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {d.shifts.map(sh => (
                                    <tr key={sh.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>{fmtDate(sh.start_time)}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmtTime(sh.start_time)}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmtTime(sh.end_time)}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>{sh.actual_hours}h</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: sh.overtime_hours > 0 ? '#f59e0b' : 'var(--muted)' }}>
                                            {sh.overtime_hours > 0 ? `+${sh.overtime_hours}h` : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: sh.overtime_hours > 0 ? '#10b981' : 'var(--text)' }}>
                                            {sh.actual_hours + sh.overtime_hours}h
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--text)', fontFamily: "'Geist Variable', sans-serif" }}>{sh.client_name || '—'}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, textTransform: 'capitalize', fontFamily: "'Geist Variable', sans-serif", color: SHIFT_COLORS[sh.status] || '#94a3b8', background: `${SHIFT_COLORS[sh.status] || '#94a3b8'}1a`, border: `1px solid ${SHIFT_COLORS[sh.status] || '#94a3b8'}44` }}>
                                                {sh.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════════ */
const FinanceDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'overview');
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const chartMuted = isDark ? '#94a3b8' : '#64748b';
    const chartGrid = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && section !== activeSection) {
            setActiveSection(section);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams]);
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [report, setReport] = useState({ revenue: 0, expenses: 0, profit: 0 });
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isExpenseOpen, setIsExpenseOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: '', customCategory: '', description: '', amount: '', expense_date: '' });
    const [formStatus, setFormStatus] = useState({ type: '', msg: '' });

    const [invoicePage, setInvoicePage] = useState(1);
    const [expensePage, setExpensePage] = useState(1);
    const [payroll, setPayroll] = useState([]);
    const [payrollPage, setPayrollPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

    /* ── Detail modal state ── */
    const [detailModal, setDetailModal] = useState({ open: false, type: '', data: null, loading: false });

    const openDetail = async (type, id) => {
        setDetailModal({ open: true, type, data: null, loading: true });
        const paths = {
            invoice: `/api/finance/invoices/${id}`,
            expense: `/api/finance/expenses/${id}`,
            payroll: `/api/finance/payroll/${id}`,
        };
        try {
            const data = await apiFetch(paths[type]).then(r => r.json());
            setDetailModal({ open: true, type, data, loading: false });
        } catch {
            setDetailModal({ open: false, type: '', data: null, loading: false });
        }
    };

    const closeDetail = () => setDetailModal({ open: false, type: '', data: null, loading: false });

    /* ── Data fetching ── */
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [reportRes, invoicesRes, expensesRes, payrollRes] = await Promise.all([
                apiFetch(`/api/finance/reports?month=${month}`).then(r => r.json()),
                apiFetch(`/api/finance/invoices`).then(r => r.json()),
                apiFetch(`/api/finance/expenses`).then(r => r.json()),
                apiFetch(`/api/finance/payroll?month=${month}`).then(r => r.json()),
            ]);
            setReport(reportRes || { revenue: 0, expenses: 0, profit: 0 });
            setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
            setExpenses(Array.isArray(expensesRes) ? expensesRes : []);
            setPayroll(Array.isArray(payrollRes) ? payrollRes : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchDashboardData(); setInvoicePage(1); setExpensePage(1); setPayrollPage(1); }, [month]);
    useEffect(() => { setInvoicePage(1); }, [invoiceStatusFilter]);
    useEffect(() => { setExpensePage(1); }, [expenseCategoryFilter]);

    const handleAddExpense = async (e) => {
        e.preventDefault(); setFormStatus({ type: '', msg: '' });
        const resolvedCategory = expenseForm.category === 'Other'
            ? (expenseForm.customCategory.trim() ? `Other: ${expenseForm.customCategory.trim()}` : 'Other')
            : expenseForm.category;
        try {
            const res = await apiFetch('/api/finance/expenses', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: resolvedCategory, description: expenseForm.description, amount: parseFloat(expenseForm.amount), expense_date: expenseForm.expense_date }),
            });
            if (res.ok) {
                setFormStatus({ type: 'success', msg: 'Expense added successfully' });
                setExpenseForm({ category: '', customCategory: '', description: '', amount: '', expense_date: '' });
                fetchDashboardData();
                setTimeout(() => setIsExpenseOpen(false), 1000);
            } else {
                const d = await res.json().catch(() => ({}));
                setFormStatus({ type: 'error', msg: d.error || 'Failed to add expense' });
            }
        } catch { setFormStatus({ type: 'error', msg: 'Network error' }); }
    };

    const handleMarkAsPaid = async (id) => {
        try {
            const res = await apiFetch(`/api/finance/invoices/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' }),
            });
            if (res.ok) fetchDashboardData();
        } catch (e) { console.error(e); }
    };

    const handleMarkPayrollPaid = async (id) => {
        try {
            const res = await apiFetch(`/api/finance/payroll/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' }),
            });
            if (res.ok) fetchDashboardData();
        } catch (e) { console.error(e); }
    };

    /* ── Derived values ── */
    const profitMargin = report.revenue > 0 ? ((report.profit / report.revenue) * 100).toFixed(1) : 0;
    const paidInvoices      = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices   = invoices.filter(i => i.status === 'pending').length;
    const totalExpAmt       = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const pendingPayrollCount = payroll.filter(p => p.status === 'pending').length;
    const paidPayrollCount    = payroll.filter(p => p.status === 'paid').length;
    const totalPayrollPay     = payroll.reduce((s, p) => s + (Number(p.total_pay) || 0), 0);

    const chartData = [
        { name: 'Revenue',  amount: report.revenue  || 0, fill: '#10b981' },
        { name: 'Expenses', amount: report.expenses || 0, fill: '#ef4444' },
    ];

    const navItems = [
        { id: 'overview',  label: 'P&L Overview', icon: LayoutDashboard },
        { id: 'invoices',  label: 'Invoices',      icon: Receipt,  count: pendingInvoices },
        { id: 'expenses',  label: 'Expenses',      icon: Wallet,   count: expenses.length },
        { id: 'payroll',   label: 'Payroll',        icon: Banknote, count: pendingPayrollCount },
    ];

    /* ── Shared empty state ── */
    const EmptyState = ({ icon: Icon, text }) => (
        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '52px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--faint)' }}>
                <Icon size={32} />
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{text}</p>
            </div>
        </td></tr>
    );

    /* ── Loading row ── */
    const LoadingRow = ({ cols }) => (
        <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '52px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)' }}>
                <Clock size={15} style={{ animation: 'fd-pulse 1.4s infinite' }} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>Loading…</span>
            </div>
        </td></tr>
    );

    /* ── Pagination bar ── */
    const PaginationBar = ({ page, setPage, total }) => {
        if (total <= ITEMS_PER_PAGE) return null;
        const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        const safe = Math.min(page, totalPages);
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    {(safe - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safe * ITEMS_PER_PAGE, total)} <span style={{ color: 'var(--faint)' }}>/ {total}</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="pg-btn" disabled={safe <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={14} /></button>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)', minWidth: 48, textAlign: 'center' }}>{safe} / {totalPages}</span>
                    <button className="pg-btn" disabled={safe >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight size={14} /></button>
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════════════════════════════════════
       SECTION: OVERVIEW
    ════════════════════════════════════════════════════════════════════════ */
    const renderOverview = () => {
        const revenueRatio = (report.revenue + report.expenses) > 0
            ? (report.revenue / (report.revenue + report.expenses)) * 100 : 50;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── KPI Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {/* Revenue */}
                    <div className="fd-kpi fd-animate fd-animate-d1">
                        <div className="top-bar" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                        <div style={{ padding: '22px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--green-dim)', border: '1px solid rgba(0,214,143,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IndianRupee size={16} color="var(--green)" />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <ArrowUpRight size={11} /> Revenue
                                </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Total Revenue</p>
                            <h3 className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                                ₹{(report.revenue || 0).toLocaleString('en-IN')}
                            </h3>
                            <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FileText size={11} /> {paidInvoices} paid invoice{paidInvoices !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="fd-kpi fd-animate fd-animate-d2">
                        <div className="top-bar" style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                        <div style={{ padding: '22px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(255,85,85,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Wallet size={16} color="var(--red)" />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', background: 'var(--red-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <ArrowDownRight size={11} /> Expense
                                </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Total Expenses</p>
                            <h3 className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                                ₹{(report.expenses || 0).toLocaleString('en-IN')}
                            </h3>
                            <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Receipt size={11} /> {expenses.length} expense record{expenses.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Net Profit */}
                    <div className="fd-kpi fd-animate fd-animate-d3">
                        <div className="top-bar" style={{ background: report.profit >= 0 ? 'linear-gradient(90deg,#f97316,#ea580c)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                        <div style={{ padding: '22px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: report.profit >= 0 ? 'var(--gold-dim)' : 'var(--red-dim)', border: `1px solid ${report.profit >= 0 ? 'rgba(240,165,0,.2)' : 'rgba(255,85,85,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {report.profit >= 0 ? <TrendingUp size={16} color="var(--gold)" /> : <TrendingDown size={16} color="var(--red)" />}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: report.profit >= 0 ? 'var(--gold)' : 'var(--red)', background: report.profit >= 0 ? 'var(--gold-dim)' : 'var(--red-dim)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    {report.profit >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                    {profitMargin}% margin
                                </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Net Profit</p>
                            <h3 className="mono" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: report.profit >= 0 ? 'var(--gold)' : 'var(--red)' }}>
                                ₹{(report.profit || 0).toLocaleString('en-IN')}
                            </h3>
                            <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Activity size={11} /> {pendingInvoices} pending invoice{pendingInvoices !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Ratio bar ── */}
                <div className="fd-panel fd-animate fd-animate-d4" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span className="sec-label" style={{ flex: 1, marginRight: 16 }}>Revenue vs Expense Ratio</span>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />Rev</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />Exp</span>
                        </div>
                    </div>
                    <div className="ratio-bar">
                        {(report.revenue || report.expenses) ? (
                            <>
                                <div style={{ width: `${revenueRatio}%`, background: 'linear-gradient(90deg,#10b981,#059669)', transition: 'width .8s ease', borderRadius: '99px 0 0 99px' }} />
                                <div style={{ width: `${100 - revenueRatio}%`, background: 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width .8s ease', borderRadius: '0 99px 99px 0' }} />
                            </>
                        ) : (
                            <div style={{ width: '100%', background: 'var(--faint)', borderRadius: 99 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--green)' }}>₹{(report.revenue || 0).toLocaleString('en-IN')} <span style={{ color: 'var(--faint)' }}>({revenueRatio.toFixed(0)}%)</span></span>
                        <span style={{ color: 'var(--red)' }}>₹{(report.expenses || 0).toLocaleString('en-IN')} <span style={{ color: 'var(--faint)' }}>({(100 - revenueRatio).toFixed(0)}%)</span></span>
                    </div>
                </div>

                {/* ── Chart ── */}
                <div className="fd-panel fd-animate fd-animate-d5">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={15} color="var(--gold)" />
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Income vs Expenses</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>{month}</span>
                    </div>
                    <div style={{ height: 280, padding: '20px 16px 8px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fill: chartMuted, fontSize: 12, fontFamily: "'Geist Variable', sans-serif", fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false}
                                    tickFormatter={v => `₹${v.toLocaleString('en-IN')}`}
                                    tick={{ fill: chartMuted, fontSize: 10, fontFamily: "'Geist Variable', monospace" }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.04)' }} />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={72}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Quick stat row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {[
                        { label: 'Paid Invoices',    value: paidInvoices,    icon: BadgeCheck, color: 'var(--green)' },
                        { label: 'Pending Invoices', value: pendingInvoices, icon: Clock,      color: 'var(--amber)' },
                        { label: 'Total Expenses',   value: expenses.length, icon: Receipt,    color: 'var(--red)'   },
                        { label: 'Profit Margin',    value: `${profitMargin}%`, icon: Activity, color: report.profit >= 0 ? 'var(--gold)' : 'var(--red)' },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                        <div key={label} className="stat-mini">
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={15} color={color} />
                            </div>
                            <div>
                                <p className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{value}</p>
                                <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════════════════════════════════════
       SECTION: INVOICES
    ════════════════════════════════════════════════════════════════════════ */
    const renderInvoices = () => {
        const filtered = invoiceStatusFilter === 'all' ? invoices : invoices.filter(i => i.status === invoiceStatusFilter);
        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        const safe = Math.min(invoicePage, totalPages);
        const paginated = filtered.slice((safe - 1) * ITEMS_PER_PAGE, safe * ITEMS_PER_PAGE);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="fd-animate">
                    {[
                        { label: 'Total',   value: invoices.length, accent: 'var(--muted)'  },
                        { label: 'Paid',    value: paidInvoices,    accent: 'var(--green)'  },
                        { label: 'Pending', value: pendingInvoices, accent: 'var(--amber)'  },
                    ].map(({ label, value, accent }) => (
                        <div key={label} className="fd-panel" style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <p className="mono" style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
                            <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 6 }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Table panel */}
                <div className="fd-panel fd-animate fd-animate-d2" style={{ overflow: 'visible' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={14} color="var(--muted)" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Invoices</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Filter size={12} color="var(--muted)" />
                            {['all', 'paid', 'pending'].map(s => (
                                <button key={s} onClick={() => setInvoiceStatusFilter(s)}
                                    className={`fchip ${invoiceStatusFilter === s ? (s === 'paid' ? 'fchip-paid' : s === 'pending' ? 'fchip-pending' : 'fchip-on') : 'fchip-off'}`}>
                                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                            <thead className="fd-table-head">
                                <tr>
                                    {['Invoice ID','Client Name','Service','Amount','Status','Issued Date','Actions'].map(h => (
                                        <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow cols={7} />
                                : filtered.length === 0 ? <EmptyState icon={FileText} text={`No ${invoiceStatusFilter !== 'all' ? invoiceStatusFilter : ''} invoices found`} />
                                : paginated.map(inv => (
                                    <tr key={inv.id} className="fd-table-row" style={{ cursor: 'pointer' }} onClick={() => openDetail('invoice', inv.id)}>
                                        <td><span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>INV-{inv.id.toString().padStart(4, '0')}</span></td>
                                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{inv.client_name || 'N/A'}</td>
                                        <td>{(() => {
                                            const svc = SERVICE_COLORS[inv.service] || DEFAULT_SVC;
                                            return (
                                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap', background: svc.bg, border: `1px solid ${svc.border}`, color: svc.color }}>
                                                    {inv.service || '—'}
                                                </span>
                                            );
                                        })()}</td>
                                        <td><span className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>₹{inv.amount.toLocaleString('en-IN')}</span></td>
                                        <td>
                                            <span className={`chip ${inv.status === 'paid' ? 'chip-paid' : 'chip-pending'}`}>
                                                <span className={`chip-dot ${inv.status === 'paid' ? 'chip-dot-paid' : 'chip-dot-pending'}`} />
                                                {inv.status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(inv.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {inv.status === 'pending'
                                                ? <button className="btn-mark-paid" onClick={e => { e.stopPropagation(); handleMarkAsPaid(inv.id); }}><BadgeCheck size={13} /> Mark Paid</button>
                                                : <span className="btn-settled"><CircleCheck size={12} /> Settled</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar page={safe} setPage={setInvoicePage} total={filtered.length} />
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════════════════════════════════════
       SECTION: EXPENSES
    ════════════════════════════════════════════════════════════════════════ */
    const renderExpenses = () => {
        const normalizeOther = cat => (cat && cat.startsWith('Other')) ? 'Other' : cat;
        const filtered = expenseCategoryFilter === 'all'
            ? expenses
            : expenseCategoryFilter === 'Other'
                ? expenses.filter(e => e.category === 'Other' || e.category?.startsWith('Other: '))
                : expenses.filter(e => e.category === expenseCategoryFilter);
        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        const safe = Math.min(expensePage, totalPages);
        const paginated = filtered.slice((safe - 1) * ITEMS_PER_PAGE, safe * ITEMS_PER_PAGE);
        const categories = Array.from(new Set(expenses.map(e => normalizeOther(e.category)).filter(Boolean)));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Total card */}
                <div className="fd-panel fd-animate" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ff5555,#c02020)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,85,85,.25)' }}>
                                <Banknote size={20} color="#fff" />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Total Expenditure</p>
                                <p className="mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--red)', lineHeight: 1 }}>₹{totalExpAmt.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 6 }}>{expenses.length} records</span>
                    </div>
                </div>

                {/* Table panel */}
                <div className="fd-panel fd-animate fd-animate-d2">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Wallet size={14} color="var(--muted)" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Expenses</span>
                        </div>
                        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                            <DialogTrigger asChild>
                                <button className="btn-add"><Plus size={13} /> Add Expense</button>
                            </DialogTrigger>
                            <DialogContent className="fd-root" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, fontFamily: 'var(--font-ui)', color: 'var(--text)', maxWidth: 420 }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700 }}>Add New Expense</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
                                    {/* Category dropdown */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Category</label>
                                        <select
                                            required
                                            value={expenseForm.category}
                                            onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value, customCategory: '' })}
                                            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '9px 12px', color: expenseForm.category ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: 13, outline: 'none', colorScheme: isDark ? 'dark' : 'light', cursor: 'pointer' }}
                                            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                                        >
                                            <option value="" disabled>Select a category…</option>
                                            {EXPENSE_CATEGORIES.map(cat => {
                                                const c = CAT_COLORS[cat] || DEFAULT_CAT;
                                                return <option key={cat} value={cat}>{cat}</option>;
                                            })}
                                        </select>
                                        {/* Category color preview */}
                                        {expenseForm.category && expenseForm.category !== 'Other' && (() => {
                                            const c = CAT_COLORS[expenseForm.category] || DEFAULT_CAT;
                                            return (
                                                <span style={{ alignSelf: 'flex-start', fontSize: 11, padding: '2px 10px', borderRadius: 6, fontWeight: 600, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
                                                    {expenseForm.category}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {/* Other — custom category input */}
                                    {expenseForm.category === 'Other' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Specify Category</label>
                                            <input
                                                type="text" placeholder="e.g., Court Fees, Audit Charges" maxLength={200}
                                                value={expenseForm.customCategory}
                                                onChange={e => setExpenseForm({ ...expenseForm, customCategory: e.target.value })}
                                                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 13, outline: 'none' }}
                                                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                                                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                                            />
                                        </div>
                                    )}
                                    {/* Description */}
                                    {[{ label: 'Description', key: 'description', type: 'text', placeholder: 'Brief description' },
                                      { label: 'Amount (₹)', key: 'amount', type: 'number', placeholder: '0' },
                                      { label: 'Date', key: 'expense_date', type: 'date', placeholder: '' },
                                    ].map(({ label, key, type, placeholder }) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>{label}</label>
                                            <input
                                                type={type} required placeholder={placeholder}
                                                value={expenseForm[key]}
                                                onChange={e => setExpenseForm({ ...expenseForm, [key]: e.target.value })}
                                                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 13, outline: 'none', colorScheme: isDark ? 'dark' : 'light' }}
                                                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                                                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                                                min={type === 'number' ? 1 : undefined}
                                            />
                                        </div>
                                    ))}
                                    {formStatus.msg && (
                                        <p style={{ fontSize: 12, color: formStatus.type === 'success' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>{formStatus.msg}</p>
                                    )}
                                    <button type="submit" className="btn-add" style={{ justifyContent: 'center', marginTop: 4, padding: '10px 0' }}>
                                        Save Expense
                                    </button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Category filters */}
                    {expenses.length > 0 && (
                        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                            <Filter size={12} color="var(--muted)" style={{ marginRight: 2 }} />
                            {['all', ...categories].map(cat => (
                                <button key={cat} onClick={() => setExpenseCategoryFilter(cat)}
                                    className={`fchip ${expenseCategoryFilter === cat ? 'fchip-on' : 'fchip-off'}`}>
                                    {cat === 'all' ? 'All' : cat}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead className="fd-table-head">
                                <tr>
                                    {['Date', 'Category', 'Description', 'Amount'].map(h => (
                                        <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow cols={4} />
                                : expenses.length === 0 ? <EmptyState icon={Wallet} text="No expenses recorded" />
                                : filtered.length === 0 ? <EmptyState icon={Wallet} text={`No ${expenseCategoryFilter} expenses found`} />
                                : paginated.map(exp => {
                                    const catKey = exp.category?.startsWith('Other') ? 'Other' : exp.category;
                                    const cc = CAT_COLORS[catKey] || DEFAULT_CAT;
                                    const isOtherSub = exp.category?.startsWith('Other: ');
                                    const subLabel = isOtherSub ? exp.category.slice(7) : null;
                                    return (
                                        <tr key={exp.id} className="fd-table-row" style={{ cursor: 'pointer' }} onClick={() => openDetail('expense', exp.id)}>
                                            <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <span className="cat-badge" style={{ background: cc.bg, color: cc.color, borderColor: cc.border }}>
                                                    {catKey === 'Other'
                                                        ? <>Other{subLabel && <><span style={{ opacity: .45, margin: '0 4px', fontWeight: 400 }}>·</span>{subLabel}</>}</>
                                                        : exp.category}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text)', fontSize: 13 }}>{exp.description}</td>
                                            <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>−₹{exp.amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar page={safe} setPage={setExpensePage} total={filtered.length} />
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════════════════════════════════════
       SECTION: PAYROLL DISBURSEMENT
    ════════════════════════════════════════════════════════════════════════ */
    const renderPayroll = () => {
        const totalPages = Math.max(1, Math.ceil(payroll.length / ITEMS_PER_PAGE));
        const safe = Math.min(payrollPage, totalPages);
        const paginated = payroll.slice((safe - 1) * ITEMS_PER_PAGE, safe * ITEMS_PER_PAGE);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="fd-animate">
                    {[
                        { label: 'Total Records', value: payroll.length,        accent: 'var(--muted)'  },
                        { label: 'Pending',        value: pendingPayrollCount,   accent: 'var(--amber)'  },
                        { label: 'Paid',           value: paidPayrollCount,      accent: 'var(--green)'  },
                    ].map(({ label, value, accent }) => (
                        <div key={label} className="fd-panel" style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <p className="mono" style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
                            <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 6 }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Total disbursement card */}
                <div className="fd-panel fd-animate fd-animate-d2" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(249,115,22,.25)' }}>
                                <Banknote size={20} color="#fff" />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Total Payroll Disbursement</p>
                                <p className="mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>₹{totalPayrollPay.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 6 }}>{payroll.length} records</span>
                    </div>
                </div>

                {/* Payroll table */}
                <div className="fd-panel fd-animate fd-animate-d3">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={14} color="var(--muted)" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Guard Payroll — {month}</span>
                        </div>
                        {pendingPayrollCount > 0 && (
                            <span style={{ fontSize: 11, color: 'var(--amber)', background: 'rgba(245,158,11,.10)', border: '1px solid rgba(245,158,11,.2)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                                {pendingPayrollCount} pending disbursement{pendingPayrollCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead className="fd-table-head">
                                <tr>
                                    {['Guard Name', 'Month', 'Billable Hrs', 'Rate / Hr', 'Total Pay', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{ textAlign: ['Billable Hrs', 'Rate / Hr', 'Total Pay', 'Action'].includes(h) ? 'right' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow cols={7} />
                                : payroll.length === 0
                                    ? <EmptyState icon={Banknote} text="No payroll records for this month. HR must finalize payroll first." />
                                    : paginated.map((p, idx) => (
                                        <tr key={p.id || idx} className="fd-table-row" style={{ cursor: 'pointer' }} onClick={() => openDetail('payroll', p.id)}>
                                            <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.guard_name || 'N/A'}</td>
                                            <td><span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{p.month}</span></td>
                                            <td className="mono" style={{ textAlign: 'right', color: 'var(--text)' }}>
                                                {(p.total_hours || 0) + (p.overtime_hours || 0)}
                                                {p.overtime_hours > 0 && <span style={{ fontSize: 9, marginLeft: 4, color: '#f59e0b', fontWeight: 700 }}>OT</span>}
                                            </td>
                                            <td className="mono" style={{ textAlign: 'right', color: 'var(--muted)' }}>₹{Number(p.rate_per_hour).toLocaleString('en-IN')}</td>
                                            <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>₹{Number(p.total_pay).toLocaleString('en-IN')}</td>
                                            <td>
                                                <span className={`chip ${p.status === 'paid' ? 'chip-paid' : 'chip-pending'}`}>
                                                    <span className={`chip-dot ${p.status === 'paid' ? 'chip-dot-paid' : 'chip-dot-pending'}`} />
                                                    {p.status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {p.status === 'pending'
                                                    ? <button className="btn-mark-paid" onClick={e => { e.stopPropagation(); handleMarkPayrollPaid(p.id); }}><BadgeCheck size={13} /> Mark Paid</button>
                                                    : <span className="btn-settled"><CircleCheck size={12} /> Disbursed</span>
                                                }
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar page={safe} setPage={setPayrollPage} total={payroll.length} />
                </div>
            </div>
        );
    };

    const sectionMap = { overview: renderOverview, invoices: renderInvoices, expenses: renderExpenses, payroll: renderPayroll };

    /* ════════════════════════════════════════════════════════════════════════
       ROOT RENDER
    ════════════════════════════════════════════════════════════════════════ */
    return (
        <div className="fd-root" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>

            {/* ── Sidebar ── */}
            <aside style={{ width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                {/* Logo area */}
                <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px var(--gold-glow)' }}>
                            <IndianRupee size={16} color="#f8fafc" />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '.01em' }}>Finance Panel</p>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', background: 'var(--gold-dim)', padding: '1px 6px', borderRadius: 4 }}>Finance Access</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                    <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--faint)', padding: '6px 8px 10px' }}>Navigation</p>
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveSection(item.id)}
                            className={`fd-nav-btn ${activeSection === item.id ? 'active' : ''}`}>
                            <item.icon size={16} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.count > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'center', padding: '1px 6px', borderRadius: 99, background: activeSection === item.id ? 'var(--gold)' : 'var(--surface2)', color: activeSection === item.id ? '#07070d' : 'var(--muted)', border: activeSection === item.id ? 'none' : '1px solid var(--border)' }}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                        <ShieldCheck size={14} color="var(--green)" />
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.04em' }}>Secure Access</p>
                            <p style={{ fontSize: 9, color: 'var(--faint)', marginTop: 1 }}>Data encrypted</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingTop: 0 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>
                                    {navItems.find(i => i.id === activeSection)?.label}
                                </h1>
                                {activeSection === 'overview' && (
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, background: report.profit >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: report.profit >= 0 ? 'var(--green)' : 'var(--red)', border: `1px solid ${report.profit >= 0 ? 'rgba(0,214,143,.2)' : 'rgba(255,85,85,.2)'}` }}>
                                        {report.profit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                        {report.profit >= 0 ? 'Profitable' : 'Loss'}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Manage revenue, expenses, and invoices.</p>
                        </div>

                        {/* Month picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 11, padding: '8px 14px' }}>
                            <Calendar size={14} color="var(--gold)" />
                            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, outline: 'none', colorScheme: isDark ? 'dark' : 'light', cursor: 'pointer' }} />
                        </div>
                    </div>

                    {/* Section content */}
                    {(sectionMap[activeSection] || sectionMap.overview)()}
                </div>
            </main>

            {/* ── Detail Modal ── */}
            <Dialog open={detailModal.open} onOpenChange={open => { if (!open) closeDetail(); }}>
                <DialogContent
                    aria-describedby={undefined}
                    className="p-0 overflow-hidden sm:max-w-[680px]"
                    style={{ borderRadius: 16 }}
                >
                    <div className="fd-root" style={{ maxHeight: '85vh', overflowY: 'auto', background: 'var(--surface)', color: 'var(--text)' }}>
                        <DialogTitle className="sr-only">
                            {detailModal.type === 'invoice' ? 'Invoice Detail'
                                : detailModal.type === 'expense' ? 'Expense Detail'
                                : detailModal.type === 'payroll' ? 'Payroll Detail'
                                : 'Detail'}
                        </DialogTitle>
                        {detailModal.loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 72 }}>
                                <div style={{ width: 34, height: 34, border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            </div>
                        ) : detailModal.data && detailModal.type === 'invoice' ? (
                            <InvoiceDetailContent data={detailModal.data} />
                        ) : detailModal.data && detailModal.type === 'expense' ? (
                            <ExpenseDetailContent data={detailModal.data} />
                        ) : detailModal.data && detailModal.type === 'payroll' ? (
                            <PayrollDetailContent data={detailModal.data} />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinanceDashboard;