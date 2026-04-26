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
import { IndianRupee, TrendingUp, TrendingDown, Receipt, Wallet, Calendar, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

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

        const navItems = [
        { id: 'overview', label: 'P&L Overview', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'expenses', label: 'Expenses', icon: Wallet },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'invoices':
                return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Invoices</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Manage client billing and track payments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Invoice ID</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Service</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Amount</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Issued Date</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
                                        ) : invoices.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No invoices found.</TableCell></TableRow>
                                        ) : (() => {
                                            const totalInvPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));
                                            const safeInvPage = Math.min(invoicePage, totalInvPages);
                                            const paginatedInvoices = invoices.slice((safeInvPage - 1) * ITEMS_PER_PAGE, safeInvPage * ITEMS_PER_PAGE);
                                            return paginatedInvoices.map(inv => (
                                                <TableRow key={inv.id} className="border-slate-100 dark:border-slate-800">
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">INV-{inv.id.toString().padStart(4, '0')}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{inv.client_name || 'N/A'}</TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{inv.service}</TableCell>
                                                    <TableCell className="font-medium text-slate-900 dark:text-white">₹{inv.amount.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'pending' : 'outline'} className="shadow-none">
                                                            {inv.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{new Date(inv.issued_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        {inv.status === 'pending' && (
                                                            <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(inv.id)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20">
                                                                Mark Paid
                                                            </Button>
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
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing {(safeInvPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeInvPage * ITEMS_PER_PAGE, invoices.length)} of {invoices.length} invoices
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={safeInvPage <= 1} onClick={() => setInvoicePage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Page {safeInvPage} of {totalInvPages}</span>
                                            <Button variant="outline" size="sm" disabled={safeInvPage >= totalInvPages} onClick={() => setInvoicePage(p => Math.min(totalInvPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}                        </CardContent>
                    </Card>
                );
            case 'expenses':
                return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white">Expenses</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">Track company expenditures.</CardDescription>
                            </div>
                            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20">Add Expense</Button>
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
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Date</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Category</TableHead>
                                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Description</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                                        ) : expenses.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">No expenses found.</TableCell></TableRow>
                                        ) : (() => {
                                            const totalExpPages = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
                                            const safeExpPage = Math.min(expensePage, totalExpPages);
                                            const paginatedExpenses = expenses.slice((safeExpPage - 1) * ITEMS_PER_PAGE, safeExpPage * ITEMS_PER_PAGE);
                                            return paginatedExpenses.map(exp => (
                                                <TableRow key={exp.id} className="border-slate-100 dark:border-slate-800">
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{exp.expense_date}</TableCell>
                                                    <TableCell><Badge variant="outline" className="shadow-none border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{exp.category}</Badge></TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">{exp.description}</TableCell>
                                                    <TableCell className="text-right font-medium text-red-600 dark:text-red-400">₹{exp.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>                            {expenses.length > ITEMS_PER_PAGE && (() => {
                                const totalExpPages = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
                                const safeExpPage = Math.min(expensePage, totalExpPages);
                                return (
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing {(safeExpPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeExpPage * ITEMS_PER_PAGE, expenses.length)} of {expenses.length} expenses
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={safeExpPage <= 1} onClick={() => setExpensePage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Page {safeExpPage} of {totalExpPages}</span>
                                            <Button variant="outline" size="sm" disabled={safeExpPage >= totalExpPages} onClick={() => setExpensePage(p => Math.min(totalExpPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}                        </CardContent>
                    </Card>
                );
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500">
                                        <IndianRupee className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{(report.revenue || 0).toLocaleString()}</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{(report.expenses || 0).toLocaleString()}</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className={`p-4 rounded-xl ${report.profit >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500'}`}>
                                        {report.profit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Profit</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <h3 className={`text-2xl font-bold ${report.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                ₹{(report.profit || 0).toLocaleString()}
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Income vs Expenses ({month})</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} tick={{fill: '#64748b'}} />
                                        <Tooltip 
                                            formatter={(value) => [`₹${value}`, 'Amount']}
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a' }}
                                            labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Finance Panel</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Finance Access</p>
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
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage revenue, expenses, and invoices.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-500" />
                                <Input 
                                    type="month" 
                                    value={month} 
                                    onChange={(e) => setMonth(e.target.value)} 
                                    className="w-auto bg-white dark:bg-slate-900"
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