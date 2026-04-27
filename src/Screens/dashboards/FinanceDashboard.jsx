import React, { useState, useEffect } from 'react';
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
    Sparkles, Eye, MoreHorizontal, Filter, PieChart, ShieldCheck, Banknote
} from 'lucide-react';

const FinanceDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const [report, setReport] = useState({ revenue: 0, expenses: 0, profit: 0 });
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: "", description: "", amount: "", expense_date: "" });
    const [formStatus, setFormStatus] = useState({ type: "", msg: "" });

    const [invoicePage, setInvoicePage] = useState(1);
    const [expensePage, setExpensePage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [reportRes, invoicesRes, expensesRes] = await Promise.all([
                apiFetch(`/api/finance/reports?month=${month}`).then(res => res.json()),
                apiFetch(`/api/finance/invoices`).then(res => res.json()),
                apiFetch(`/api/finance/expenses`).then(res => res.json())
            ]);
            
            setReport(reportRes || { revenue: 0, expenses: 0, profit: 0 });
            setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
            setExpenses(Array.isArray(expensesRes) ? expensesRes : []);
        } catch (error) {
            console.error("Error fetching finance data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDashboardData();
        setInvoicePage(1);
        setExpensePage(1);
    }, [month]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });
        try {
            const payload = {
                category: expenseForm.category,
                description: expenseForm.description,
                amount: parseFloat(expenseForm.amount),
                expense_date: expenseForm.expense_date
            };
            const res = await apiFetch("/api/finance/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setFormStatus({ type: "success", msg: "Expense added successfully" });
                setExpenseForm({ category: "", description: "", amount: "", expense_date: "" });
                fetchDashboardData();
                setTimeout(() => setIsExpenseOpen(false), 1000);
            } else {
                const data = await res.json().catch(() => ({}));
                setFormStatus({ type: "error", msg: data.error || "Failed to add expense" });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "Network error" });
        }
    };

    const handleMarkAsPaid = async (id) => {
        try {
            const res = await apiFetch(`/api/finance/invoices/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "paid" })
            });
            if (res.ok) {
                fetchDashboardData();
            }
        } catch (err) {
            console.error("Error updating invoice:", err);
        }
    };

    const chartData = [
        { name: 'Revenue', amount: report.revenue || 0, fill: '#10b981' },
        { name: 'Expenses', amount: report.expenses || 0, fill: '#ef4444' }
    ];

    const profitMargin = report.revenue > 0 ? ((report.profit / report.revenue) * 100).toFixed(1) : 0;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;

    const navItems = [
        { id: 'overview', label: 'P&L Overview', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: Receipt, count: pendingInvoices },
        { id: 'expenses', label: 'Expenses', icon: Wallet, count: expenses.length },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'invoices':
                return (
                    <div className="space-y-5">
                        {/* Invoice stats summary */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Total', value: invoices.length, color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
                                { label: 'Paid', value: paidInvoices, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                                { label: 'Pending', value: pendingInvoices, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                                    <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${color}`}>{label}</span>
                                </div>
                            ))}
                        </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Invoices
                                </h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Manage client billing and track payments</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice ID</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Client Name</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Service</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Issued Date</TableHead>
                                            <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400"><div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4 animate-pulse" /> Loading invoices...</div></TableCell></TableRow>
                                        ) : invoices.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600"><FileText className="w-8 h-8" /><p className="text-sm">No invoices found</p></div></TableCell></TableRow>
                                        ) : (() => {
                                            const totalInvPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));
                                            const safeInvPage = Math.min(invoicePage, totalInvPages);
                                            const paginatedInvoices = invoices.slice((safeInvPage - 1) * ITEMS_PER_PAGE, safeInvPage * ITEMS_PER_PAGE);
                                            return paginatedInvoices.map(inv => (
                                                <TableRow key={inv.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-white">INV-{inv.id.toString().padStart(4, '0')}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{inv.client_name || 'N/A'}</TableCell>
                                                    <TableCell><span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{inv.service}</span></TableCell>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-white">₹{inv.amount.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                                            inv.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                            {inv.status === 'paid' ? 'Paid' : 'Pending'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{new Date(inv.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                                                    <TableCell className="text-right">
                                                        {inv.status === 'pending' && (
                                                            <button onClick={() => handleMarkAsPaid(inv.id)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                                                                <BadgeCheck className="w-3.5 h-3.5" /> Mark Paid
                                                            </button>
                                                        )}
                                                        {inv.status === 'paid' && (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-600">Completed</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {invoices.length > ITEMS_PER_PAGE && (() => {
                                const totalInvPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));
                                const safeInvPage = Math.min(invoicePage, totalInvPages);
                                return (
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(safeInvPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeInvPage * ITEMS_PER_PAGE, invoices.length)}</span> of {invoices.length}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <button disabled={safeInvPage <= 1} onClick={() => setInvoicePage(p => Math.max(1, p - 1))} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">{safeInvPage} / {totalInvPages}</span>
                                            <button disabled={safeInvPage >= totalInvPages} onClick={() => setInvoicePage(p => Math.min(totalInvPages, p + 1))} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                    </div>
                    </div>
                );
            case 'expenses':
                return (
                    <div className="space-y-5">
                        {/* Expense total card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm shadow-red-500/20">
                                        <Banknote className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenditure</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">₹{expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{expenses.length} records</span>
                            </div>
                        </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Expenses
                                </h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Track company expenditures</p>
                            </div>
                            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                                <DialogTrigger asChild>
                                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm shadow-orange-500/20 transition-all">
                                        <Plus className="w-3.5 h-3.5" /> Add Expense
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-900 dark:text-white">Add New Expense</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white">Category</Label>
                                            <Input required value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} placeholder="e.g., Equipment, Travel" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white">Description</Label>
                                            <Input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white">Amount (₹)</Label>
                                            <Input type="number" required min="1" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white">Date</Label>
                                            <Input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]" />
                                        </div>
                                        {formStatus.msg && (
                                            <p className={`text-sm ${formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{formStatus.msg}</p>
                                        )}
                                        <DialogFooter>
                                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20">Save Expense</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</TableHead>
                                            <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500 dark:text-slate-400"><div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4 animate-pulse" /> Loading expenses...</div></TableCell></TableRow>
                                        ) : expenses.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600"><Wallet className="w-8 h-8" /><p className="text-sm">No expenses recorded</p></div></TableCell></TableRow>
                                        ) : (() => {
                                            const totalExpPages = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
                                            const safeExpPage = Math.min(expensePage, totalExpPages);
                                            const paginatedExpenses = expenses.slice((safeExpPage - 1) * ITEMS_PER_PAGE, safeExpPage * ITEMS_PER_PAGE);
                                            const categoryColors = {
                                                Equipment: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
                                                Travel: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
                                                Salary: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                                                Utilities: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
                                                Office: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
                                            };
                                            const defaultCatColor = 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                                            return paginatedExpenses.map(exp => (
                                                <TableRow key={exp.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                                                    <TableCell><span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${categoryColors[exp.category] || defaultCatColor}`}>{exp.category}</span></TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{exp.description}</TableCell>
                                                    <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">-₹{exp.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {expenses.length > ITEMS_PER_PAGE && (() => {
                                const totalExpPages = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
                                const safeExpPage = Math.min(expensePage, totalExpPages);
                                return (
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(safeExpPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeExpPage * ITEMS_PER_PAGE, expenses.length)}</span> of {expenses.length}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <button disabled={safeExpPage <= 1} onClick={() => setExpensePage(p => Math.max(1, p - 1))} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">{safeExpPage} / {totalExpPages}</span>
                                            <button disabled={safeExpPage >= totalExpPages} onClick={() => setExpensePage(p => Math.min(totalExpPages, p + 1))} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                    </div>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        {/* Stat cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Revenue */}
                            <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                                            <IndianRupee className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <ArrowUpRight className="w-3 h-3" /> Revenue
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{(report.revenue || 0).toLocaleString()}</h3>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
                                        <FileText className="w-3 h-3" /> {paidInvoices} paid invoice{paidInvoices !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Expenses */}
                            <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm shadow-red-500/20">
                                            <Wallet className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                                            <ArrowDownRight className="w-3 h-3" /> Expense
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{(report.expenses || 0).toLocaleString()}</h3>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
                                        <Receipt className="w-3 h-3" /> {expenses.length} expense record{expenses.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Net Profit */}
                            <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                                <div className={`absolute top-0 left-0 right-0 h-1 ${report.profit >= 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-red-400 to-orange-500'}`} />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${report.profit >= 0 ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-red-400 to-orange-500 shadow-red-500/20'}`}>
                                            {report.profit >= 0 ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                                        </div>
                                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                            report.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                            {report.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {profitMargin}% margin
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</p>
                                    <h3 className={`text-2xl font-bold mt-1 ${report.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ₹{(report.profit || 0).toLocaleString()}
                                    </h3>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600">
                                        <Activity className="w-3 h-3" /> {pendingInvoices} pending invoice{pendingInvoices !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue vs Expense ratio bar */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Revenue vs Expense Ratio</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-medium">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Expenses</span>
                                </div>
                            </div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                {(report.revenue || report.expenses) ? (
                                    <>
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${(report.revenue / (report.revenue + report.expenses)) * 100}%` }} />
                                        <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-r-full transition-all duration-700" style={{ width: `${(report.expenses / (report.revenue + report.expenses)) * 100}%` }} />
                                    </>
                                ) : (
                                    <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                )}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-slate-400 dark:text-slate-600">
                                <span>₹{(report.revenue || 0).toLocaleString()} ({report.revenue > 0 ? ((report.revenue / (report.revenue + report.expenses)) * 100).toFixed(0) : 0}%)</span>
                                <span>₹{(report.expenses || 0).toLocaleString()} ({report.expenses > 0 ? ((report.expenses / (report.revenue + report.expenses)) * 100).toFixed(0) : 0}%)</span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Income vs Expenses</h3>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{month}</span>
                                </div>
                            </div>
                            <div className="h-80 p-5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} tick={{fill: '#64748b', fontSize: 11}} />
                                        <Tooltip 
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                                            cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                                            itemStyle={{ color: '#0f172a' }}
                                            labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={80}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Quick Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Paid Invoices', value: paidInvoices, icon: BadgeCheck, color: 'text-emerald-500' },
                                { label: 'Pending Invoices', value: pendingInvoices, icon: Clock, color: 'text-amber-500' },
                                { label: 'Total Expenses', value: expenses.length, icon: Receipt, color: 'text-red-500' },
                                { label: 'Profit Margin', value: `${profitMargin}%`, icon: Activity, color: report.profit >= 0 ? 'text-emerald-500' : 'text-red-500' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wider">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/20">
                            <IndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Finance Panel</h2>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">Finance Access</span>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all relative ${
                                activeSection === item.id
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500 shadow-sm shadow-orange-500/5'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            {activeSection === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />}
                            <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.count > 0 && (
                                <span className={`text-[10px] font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-full ${
                                    activeSection === item.id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>{item.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Secure Access</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-600">Data encrypted</p>
                        </div>
                    </div>
                </div>
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
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {navItems.find(i => i.id === activeSection)?.label}
                                    </h1>
                                    {activeSection === 'overview' && (
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                                            report.profit >= 0
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                            {report.profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {report.profit >= 0 ? 'Profitable' : 'Loss'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage revenue, expenses, and invoices.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <Input 
                                    type="month" 
                                    value={month} 
                                    onChange={(e) => setMonth(e.target.value)} 
                                    className="w-auto bg-transparent border-0 shadow-none focus-visible:ring-0 text-sm font-medium text-slate-700 dark:text-slate-300 p-0 h-auto dark:[color-scheme:dark]"
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
                                className="w-full bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default FinanceDashboard;