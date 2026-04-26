import React, { useState, useEffect } from 'react';
import apiFetch from "../../utils/apiFetch";
import GuardManagement from './GuardManagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../Components/ui/table";
import { Badge } from "../../Components/ui/badge";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Label } from "../../Components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../../Components/ui/dialog";
import { AlertTriangle, Calendar, Users, Clock, Banknote, FileCheck, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

const HRDashboard = () => {
    const [activeSection, setActiveSection] = useState('guards');
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

    const isPayrollFinalized = payroll.length > 0 && payroll[0].status !== 'pending';

    const navItems = [
        { id: 'guards', label: 'Guards', icon: Users },
        { id: 'shifts', label: 'Shifts', icon: Clock },
        { id: 'payroll', label: 'Payroll', icon: Banknote },
        { id: 'leaves', label: 'Leaves', icon: FileCheck },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'shifts':
                return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white">Shifts Overview</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">Manage guard assignments and hours.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Dialog open={isShiftOpen} onOpenChange={setIsShiftOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20">Add Shift</Button>
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Guard Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client/Query</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Start Time</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">End Time</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Hours</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                                        ) : shifts.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">No shifts found.</TableCell></TableRow>
                                        ) : (() => {
                                            const totalShiftPages = Math.max(1, Math.ceil(shifts.length / ITEMS_PER_PAGE));
                                            const safeShiftPage = Math.min(shiftPage, totalShiftPages);
                                            const paginatedShifts = shifts.slice((safeShiftPage - 1) * ITEMS_PER_PAGE, safeShiftPage * ITEMS_PER_PAGE);
                                            return paginatedShifts.map(shift => (
                                                <TableRow key={shift.id} className="border-slate-100 dark:border-slate-800">
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">{shift.guard_name}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{shift.client_name}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{new Date(shift.start_time).toLocaleString()}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{new Date(shift.end_time).toLocaleString()}</TableCell>
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">{shift.actual_hours}</TableCell>
                                                    <TableCell><Badge variant="outline" className="shadow-none border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{shift.status}</Badge></TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {shifts.length > ITEMS_PER_PAGE && (() => {
                                const totalShiftPages = Math.max(1, Math.ceil(shifts.length / ITEMS_PER_PAGE));
                                const safeShiftPage = Math.min(shiftPage, totalShiftPages);
                                return (
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing {(safeShiftPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeShiftPage * ITEMS_PER_PAGE, shifts.length)} of {shifts.length} shifts
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={safeShiftPage <= 1} onClick={() => setShiftPage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Page {safeShiftPage} of {totalShiftPages}</span>
                                            <Button variant="outline" size="sm" disabled={safeShiftPage >= totalShiftPages} onClick={() => setShiftPage(p => Math.min(totalShiftPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}                        </CardContent>
                    </Card>
                );
            case 'payroll':
                return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white">Payroll Processing</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">Review and finalize monthly payroll.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                {!isPayrollFinalized && payroll.length > 0 && (
                                    <Button onClick={handleFinalizePayroll} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
                                        Finalize Month
                                    </Button>
                                )}
                                {isPayrollFinalized && (
                                    <Badge variant="success" className="px-3 py-1 text-sm shadow-none">Finalized</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Guard Name</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Total Hours</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Rate / Hr</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Total Pay</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                                        ) : payroll.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">No payroll records for this month.</TableCell></TableRow>
                                        ) : (() => {
                                            const totalPayPages = Math.max(1, Math.ceil(payroll.length / ITEMS_PER_PAGE));
                                            const safePayPage = Math.min(payrollPage, totalPayPages);
                                            const paginatedPayroll = payroll.slice((safePayPage - 1) * ITEMS_PER_PAGE, safePayPage * ITEMS_PER_PAGE);
                                            return paginatedPayroll.map((p, idx) => (
                                                <TableRow key={p.id || idx} className="border-slate-100 dark:border-slate-800">
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">{p.guard_name}</TableCell>
                                                    <TableCell className="text-right font-medium text-slate-900 dark:text-white">{p.total_hours}</TableCell>
                                                    <TableCell className="text-right text-slate-700 dark:text-slate-300">₹{p.rate_per_hour.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-bold text-slate-900 dark:text-white">₹{p.total_pay.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={p.status === 'paid' ? 'success' : 'pending'} className="shadow-none">{p.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {payroll.length > ITEMS_PER_PAGE && (() => {
                                const totalPayPages = Math.max(1, Math.ceil(payroll.length / ITEMS_PER_PAGE));
                                const safePayPage = Math.min(payrollPage, totalPayPages);
                                return (
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing {(safePayPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePayPage * ITEMS_PER_PAGE, payroll.length)} of {payroll.length} records
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={safePayPage <= 1} onClick={() => setPayrollPage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Page {safePayPage} of {totalPayPages}</span>
                                            <Button variant="outline" size="sm" disabled={safePayPage >= totalPayPages} onClick={() => setPayrollPage(p => Math.min(totalPayPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}                        </CardContent>
                    </Card>
                );
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
        <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">HR Panel</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Human Resources Access</p>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {navItems.find(i => i.id === activeSection)?.label}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage guards, shifts, payroll, and leaves.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-500" />
                                <Input 
                                    type="month" 
                                    value={month} 
                                    onChange={(e) => setMonth(e.target.value)} 
                                    className="w-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                    
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
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;