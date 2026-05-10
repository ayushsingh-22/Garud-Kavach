import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiFetch from "../../utils/apiFetch";
import GuardManagement from './GuardManagement';
import GuardDirectory from './GuardDirectory';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../Components/ui/table";
import { Badge } from "../../Components/ui/badge";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Label } from "../../Components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../../Components/ui/dialog";
import { AlertTriangle, Calendar, Users, Clock, Banknote, FileCheck, LayoutDashboard, ChevronLeft, ChevronRight, Contact } from 'lucide-react';

const HRDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'guards');

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

    const [shifts, setShifts] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [expiringGuards, setExpiringGuards] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [shiftForm, setShiftForm] = useState({ guard_id: "", query_id: "", start_time: "", end_time: "" });
    const [formStatus, setFormStatus] = useState({ type: "", msg: "" });

    const [shiftPage, setShiftPage] = useState(1);
    const [payrollPage, setPayrollPage] = useState(1);
    const [leavePage, setLeavePage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [shiftsRes, payrollRes, leavesRes, guardsRes] = await Promise.all([
                apiFetch(`/api/hr/shifts?month=${month}`).then(res => res.json()),
                apiFetch(`/api/hr/payroll?month=${month}`).then(res => res.json()),
                apiFetch(`/api/hr/leaves`).then(res => res.json()),
                apiFetch(`/api/hr/guards/expiring`).then(res => res.json())
            ]);

            setShifts(Array.isArray(shiftsRes) ? shiftsRes : []);
            setPayroll(Array.isArray(payrollRes) ? payrollRes : []);
            setLeaves(Array.isArray(leavesRes) ? leavesRes : []);
            setExpiringGuards(Array.isArray(guardsRes) ? guardsRes : []);
        } catch (error) {
            console.error("Error fetching HR data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        setShiftPage(1);
        setPayrollPage(1);
        setLeavePage(1);

        // Poll every 30 s so shifts, payroll, and leaves stay fresh without a manual refresh.
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, [month]);

    const handleAddShift = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });
        try {
            const payload = {
                guard_id: parseInt(shiftForm.guard_id),
                query_id: parseInt(shiftForm.query_id),
                start_time: shiftForm.start_time ? new Date(shiftForm.start_time).toISOString() : null,
                end_time: shiftForm.end_time ? new Date(shiftForm.end_time).toISOString() : null,
            };
            const res = await apiFetch("/api/hr/shifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setFormStatus({ type: "success", msg: "Shift added successfully" });
                setShiftForm({ guard_id: "", query_id: "", start_time: "", end_time: "" });
                fetchData();
                setTimeout(() => setIsShiftOpen(false), 1000);
            } else {
                const data = await res.json().catch(() => ({}));
                setFormStatus({ type: "error", msg: data.error || "Failed to add shift" });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "Network error" });
        }
    };

    const handleFinalizePayroll = async () => {
        if (!window.confirm("Are you sure you want to finalize payroll for this month? This cannot be undone.")) return;
        try {
            const res = await apiFetch(`/api/hr/payroll/finalize?month=${month}`, { method: "POST" });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to finalize payroll");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeaveStatus = async (id, status) => {
        try {
            const res = await apiFetch(`/api/hr/leaves/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Payroll is finalized when the records are already stored in the DB (have an id).
    // Calculated-on-the-fly records returned by the API when no DB row exists have id === null.
    const isPayrollFinalized = payroll.length > 0 && payroll[0].id != null;

    const navItems = [
        { id: 'guards', label: 'Guards', icon: Users },
        { id: 'directory', label: 'Guard Directory', icon: Contact },
        { id: 'shifts', label: 'Shifts', icon: Clock },
        { id: 'payroll', label: 'Payroll', icon: Banknote },
        { id: 'leaves', label: 'Leaves', icon: FileCheck },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'shifts': {
                const now = new Date();
                const scheduledCount  = shifts.filter(s => now < new Date(s.start_time)).length;
                const activeCount     = shifts.filter(s => now >= new Date(s.start_time) && now <= new Date(s.end_time)).length;
                const completedCount  = shifts.filter(s => now > new Date(s.end_time)).length;

                const shiftBadgeClass = (shift) => {
                    const n = new Date(), st = new Date(shift.start_time), en = new Date(shift.end_time);
                    if (n >= st && n <= en) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40';
                    if (n < st)            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-700/40';
                    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                };
                const shiftLabel = (shift) => {
                    const n = new Date(), st = new Date(shift.start_time), en = new Date(shift.end_time);
                    if (n >= st && n <= en) return 'Active';
                    if (n < st)            return 'Scheduled';
                    return 'Completed';
                };

                return (
                    <div className="space-y-4">
                        {/* Stat summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Shifts',  value: shifts.length,   textCls: 'text-slate-800 dark:text-slate-200',    bgCls: 'bg-white dark:bg-slate-900' },
                                { label: 'Scheduled',     value: scheduledCount,  textCls: 'text-blue-700 dark:text-blue-400',     bgCls: 'bg-blue-50 dark:bg-blue-500/10' },
                                { label: 'Active Now',    value: activeCount,     textCls: 'text-emerald-700 dark:text-emerald-400', bgCls: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                { label: 'Completed',     value: completedCount,  textCls: 'text-slate-500 dark:text-slate-400',   bgCls: 'bg-slate-50 dark:bg-slate-800/50' },
                            ].map(({ label, value, textCls, bgCls }) => (
                                <div key={label} className={`${bgCls} rounded-xl border border-slate-200 dark:border-slate-800 p-4`}>
                                    <p className={`text-2xl font-bold ${textCls}`}>{value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide font-medium">{label}</p>
                                </div>
                            ))}
                        </div>

                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
                                <div>
                                    <CardTitle className="text-slate-900 dark:text-white">Shifts Overview</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">Manage guard assignments and track hours.</CardDescription>
                                </div>
                                <Dialog open={isShiftOpen} onOpenChange={setIsShiftOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20">+ Add Shift</Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        <DialogHeader>
                                            <DialogTitle className="text-slate-900 dark:text-white">Schedule New Shift</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddShift} className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-900 dark:text-white">Guard ID</Label>
                                                    <Input required type="number" value={shiftForm.guard_id} onChange={e => setShiftForm({...shiftForm, guard_id: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-900 dark:text-white">Query ID (Client)</Label>
                                                    <Input required type="number" value={shiftForm.query_id} onChange={e => setShiftForm({...shiftForm, query_id: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-900 dark:text-white">Start Time</Label>
                                                <Input required type="datetime-local" value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-900 dark:text-white">End Time</Label>
                                                <Input required type="datetime-local" value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]" />
                                            </div>
                                            {formStatus.msg && (
                                                <p className={`text-sm ${formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{formStatus.msg}</p>
                                            )}
                                            <DialogFooter>
                                                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white">Save Shift</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Guard Name</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client / Site</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Start</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">End</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Hours</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">Loading shifts…</TableCell></TableRow>
                                            ) : shifts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12">
                                                        <p className="text-2xl mb-2">📋</p>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-300">No shifts found</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a shift using the button above.</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (() => {
                                                const totalShiftPages = Math.max(1, Math.ceil(shifts.length / ITEMS_PER_PAGE));
                                                const safeShiftPage   = Math.min(shiftPage, totalShiftPages);
                                                const paginatedShifts = shifts.slice((safeShiftPage - 1) * ITEMS_PER_PAGE, safeShiftPage * ITEMS_PER_PAGE);
                                                return paginatedShifts.map(shift => (
                                                    <TableRow key={shift.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <TableCell className="font-semibold text-slate-900 dark:text-white">{shift.guard_name}</TableCell>
                                                        <TableCell className="text-slate-700 dark:text-slate-300">{shift.client_name || '—'}</TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">{new Date(shift.start_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">{new Date(shift.end_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                        <TableCell className="text-right font-semibold text-slate-900 dark:text-white">{shift.actual_hours > 0 ? `${shift.actual_hours}h` : '—'}</TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${shiftBadgeClass(shift)}`}>
                                                                {shiftLabel(shift)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ));
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                                {shifts.length > ITEMS_PER_PAGE && (() => {
                                    const totalShiftPages = Math.max(1, Math.ceil(shifts.length / ITEMS_PER_PAGE));
                                    const safeShiftPage   = Math.min(shiftPage, totalShiftPages);
                                    return (
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Showing {(safeShiftPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeShiftPage * ITEMS_PER_PAGE, shifts.length)} of {shifts.length}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" disabled={safeShiftPage <= 1} onClick={() => setShiftPage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                                </Button>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{safeShiftPage} / {totalShiftPages}</span>
                                                <Button variant="outline" size="sm" disabled={safeShiftPage >= totalShiftPages} onClick={() => setShiftPage(p => Math.min(totalShiftPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                );
            }
            case 'payroll': {
                const totalGuards   = payroll.length;
                const totalHours    = payroll.reduce((s, p) => s + (Number(p.total_hours) || 0), 0);
                const totalPayout   = payroll.reduce((s, p) => s + (Number(p.total_pay) || 0), 0);
                const pendingCount  = payroll.filter(p => p.status === 'pending').length;

                return (
                    <div className="space-y-4">
                        {/* Stat summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Guards',       value: totalGuards,                    textCls: 'text-slate-800 dark:text-slate-200',    bgCls: 'bg-white dark:bg-slate-900' },
                                { label: 'Total Hours',  value: `${totalHours.toFixed(1)} h`,   textCls: 'text-blue-700 dark:text-blue-400',     bgCls: 'bg-blue-50 dark:bg-blue-500/10' },
                                { label: 'Total Payout', value: `₹${totalPayout.toLocaleString('en-IN')}`, textCls: 'text-orange-700 dark:text-orange-400', bgCls: 'bg-orange-50 dark:bg-orange-500/10' },
                                { label: 'Pending',      value: pendingCount,                   textCls: pendingCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400', bgCls: pendingCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10' },
                            ].map(({ label, value, textCls, bgCls }) => (
                                <div key={label} className={`${bgCls} rounded-xl border border-slate-200 dark:border-slate-800 p-4`}>
                                    <p className={`text-2xl font-bold ${textCls} truncate`}>{value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide font-medium">{label}</p>
                                </div>
                            ))}
                        </div>

                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
                                <div>
                                    <CardTitle className="text-slate-900 dark:text-white">Payroll Processing</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">Review hours and finalize monthly payroll for Finance.</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isPayrollFinalized ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">
                                            ✓ Finalized
                                        </span>
                                    ) : payroll.length > 0 ? (
                                        <Button onClick={handleFinalizePayroll} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
                                            Finalize Month
                                        </Button>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Guard Name</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Hours</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Rate / Hr</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Total Pay</TableHead>
                                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">Loading payroll…</TableCell></TableRow>
                                            ) : payroll.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12">
                                                        <p className="text-2xl mb-2">💰</p>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-300">No payroll records</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Payroll is calculated from shift hours for this month.</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (() => {
                                                const totalPayPages = Math.max(1, Math.ceil(payroll.length / ITEMS_PER_PAGE));
                                                const safePayPage   = Math.min(payrollPage, totalPayPages);
                                                const paginatedPay  = payroll.slice((safePayPage - 1) * ITEMS_PER_PAGE, safePayPage * ITEMS_PER_PAGE);
                                                return (
                                                    <>
                                                        {paginatedPay.map((p, idx) => (
                                                            <TableRow key={p.id || idx} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <TableCell className="font-semibold text-slate-900 dark:text-white">{p.guard_name}</TableCell>
                                                                <TableCell className="text-right font-medium text-slate-900 dark:text-white">{Number(p.total_hours).toFixed(1)}</TableCell>
                                                                <TableCell className="text-right text-slate-600 dark:text-slate-400">₹{Number(p.rate_per_hour).toLocaleString('en-IN')}</TableCell>
                                                                <TableCell className="text-right font-bold text-slate-900 dark:text-white">₹{Number(p.total_pay).toLocaleString('en-IN')}</TableCell>
                                                                <TableCell>
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                                        p.status === 'paid'
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40'
                                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-700/40'
                                                                    }`}>
                                                                        {p.status === 'paid' ? '✓ Paid' : 'Pending'}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* Totals row */}
                                                        {/* <TableRow className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 font-bold">
                                                            <TableCell className="text-slate-900 dark:text-white">Total ({totalGuards} guards)</TableCell>
                                                            <TableCell className="text-right text-slate-900 dark:text-white">{totalHours.toFixed(1)}h</TableCell>
                                                            <TableCell className="text-right text-slate-500 dark:text-slate-400">—</TableCell>
                                                            <TableCell className="text-right text-orange-700 dark:text-orange-400">₹{totalPayout.toLocaleString('en-IN')}</TableCell>
                                                            <TableCell />
                                                        </TableRow> */}
                                                    </>
                                                );
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                                {payroll.length > ITEMS_PER_PAGE && (() => {
                                    const totalPayPages = Math.max(1, Math.ceil(payroll.length / ITEMS_PER_PAGE));
                                    const safePayPage   = Math.min(payrollPage, totalPayPages);
                                    return (
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Showing {(safePayPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePayPage * ITEMS_PER_PAGE, payroll.length)} of {payroll.length}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" disabled={safePayPage <= 1} onClick={() => setPayrollPage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                                </Button>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{safePayPage} / {totalPayPages}</span>
                                                <Button variant="outline" size="sm" disabled={safePayPage >= totalPayPages} onClick={() => setPayrollPage(p => Math.min(totalPayPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                );
            }
            case 'leaves':
                return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <CardTitle className="text-slate-900 dark:text-white">Leave Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Guard Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Start Date</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">End Date</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Reason</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                                        ) : leaves.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">No leave requests found.</TableCell></TableRow>
                                        ) : (() => {
                                            const totalLeavePages = Math.max(1, Math.ceil(leaves.length / ITEMS_PER_PAGE));
                                            const safeLeavePage = Math.min(leavePage, totalLeavePages);
                                            const paginatedLeaves = leaves.slice((safeLeavePage - 1) * ITEMS_PER_PAGE, safeLeavePage * ITEMS_PER_PAGE);
                                            return paginatedLeaves.map(leave => (
                                                <TableRow key={leave.id} className="border-slate-100 dark:border-slate-800">
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">{leave.guard_name}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{leave.start_date}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{leave.end_date}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{leave.reason}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'destructive' : 'pending'} className="shadow-none">
                                                            {leave.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        {leave.status === 'pending' && (
                                                            <>
                                                                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20" onClick={() => handleLeaveStatus(leave.id, 'approved')}>Approve</Button>
                                                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 ml-2" onClick={() => handleLeaveStatus(leave.id, 'rejected')}>Reject</Button>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {leaves.length > ITEMS_PER_PAGE && (() => {
                                const totalLeavePages = Math.max(1, Math.ceil(leaves.length / ITEMS_PER_PAGE));
                                const safeLeavePage = Math.min(leavePage, totalLeavePages);
                                return (
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing {(safeLeavePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeLeavePage * ITEMS_PER_PAGE, leaves.length)} of {leaves.length} requests
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={safeLeavePage <= 1} onClick={() => setLeavePage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Page {safeLeavePage} of {totalLeavePages}</span>
                                            <Button variant="outline" size="sm" disabled={safeLeavePage >= totalLeavePages} onClick={() => setLeavePage(p => Math.min(totalLeavePages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}                        </CardContent>
                    </Card>
                );
            case 'directory':
                return <GuardDirectory />;
            case 'guards':
            default:
                return (
                    <div className="space-y-6">
                        {expiringGuards.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Document Expiry Alert</h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                        {expiringGuards.length} guard(s) have licenses expiring within 30 days. Please check the Guard list below.
                                    </p>
                                </div>
                            </div>
                        )}
                        <GuardManagement />
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            navItems={navItems}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            title="HR Panel"
            subtitle="Human Resources Access"
            pageDescription="Manage guards, shifts, payroll, and leaves."
            headerExtra={
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <Input 
                        type="month" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)} 
                        className="w-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                    />
                </div>
            }
        >
            {/* Mobile Month Selector */}
            <div className="mb-6 md:hidden flex items-center justify-between">
                 <div className="flex items-center gap-2 w-full">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <Input 
                        type="month" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                    />
                </div>
            </div>

            {renderContent()}
        </DashboardLayout>
    );
};

export default HRDashboard;