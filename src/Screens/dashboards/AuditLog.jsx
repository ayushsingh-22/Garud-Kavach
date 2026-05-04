import React, { useState, useEffect } from 'react';
import apiFetch from "../../utils/apiFetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../Components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../Components/ui/table";
import { Badge } from "../../Components/ui/badge";
import { Button } from "../../Components/ui/button";
import {
  Eye, ChevronLeft, ChevronRight, X, Clock, User, Target,
  FileText, Shield, Trash2, PenLine, Plus, Activity, Copy, CheckCheck
} from "lucide-react";

const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
};

const isIsoDate = (str) => {
    if (typeof str !== 'string') return false;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
    return isoRegex.test(str);
};

const getActionVariant = (action) => {
    if (!action) return 'default';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create') || action.includes('assign')) return 'success';
    if (action.includes('update')) return 'in_progress';
    return 'default';
};

const getActionStyle = (action) => {
    if (!action) return { gradient: 'from-slate-600 to-slate-700', icon: Activity, iconBg: 'bg-white/20', label: 'System Event' };
    if (action.includes('delete')) return { gradient: 'from-red-600 to-rose-700', icon: Trash2, iconBg: 'bg-white/20', label: 'Delete Operation' };
    if (action.includes('create')) return { gradient: 'from-emerald-600 to-teal-700', icon: Plus, iconBg: 'bg-white/20', label: 'Create Operation' };
    if (action.includes('assign')) return { gradient: 'from-blue-600 to-indigo-700', icon: Shield, iconBg: 'bg-white/20', label: 'Assignment' };
    if (action.includes('update')) return { gradient: 'from-amber-600 to-orange-700', icon: PenLine, iconBg: 'bg-white/20', label: 'Update Operation' };
    return { gradient: 'from-slate-600 to-slate-700', icon: Activity, iconBg: 'bg-white/20', label: 'System Event' };
};

// ─── Audit Detail Modal ──────────────────────────────────────────────────────

const AuditDetailModal = ({ log, onClose }) => {
    const [copied, setCopied] = useState(null);
    if (!log) return null;

    const style = getActionStyle(log.action);
    const ActionIcon = style.icon;

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const renderValue = (value, key) => {
        if (value === null || value === undefined) {
            return <span className="text-slate-400 dark:text-slate-500 italic text-sm">None</span>;
        }
        if (typeof value === 'object') {
            return (
                <pre className="text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed border border-slate-200 dark:border-slate-700/50">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }
        if (isIsoDate(value)) {
            return <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDateTime(value)}</span>;
        }
        return <span className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">{String(value)}</span>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200 dark:border-slate-700/50"
                onClick={e => e.stopPropagation()}
            >
                {/* Gradient Header */}
                <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${style.gradient}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl ${style.iconBg} flex items-center justify-center shadow-lg`}>
                            <ActionIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-white truncate">Audit Log Details</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium uppercase tracking-wide">
                                    {(log.action || 'unknown').replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-white/70">#{log.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Cards */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Timestamp</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{formatDateTime(log.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <User className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Performed By</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{log.user_email || log.user_name || `User #${log.user_id}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <Target className="w-4 h-4 text-purple-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Target</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono truncate">{log.target || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Type</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{style.label}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Payload */}
                <div className="px-6 py-4 max-h-[45vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Change Details</h4>
                    {!log.details ? (
                        <div className="flex flex-col items-center py-8 text-slate-400 dark:text-slate-500">
                            <FileText className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No additional details recorded.</p>
                        </div>
                    ) : typeof log.details !== 'object' ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{String(log.details)}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(log.details).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="group flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        {value !== null && value !== undefined && (
                                            <button
                                                onClick={() => handleCopy(value, key)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                                                title="Copy value"
                                            >
                                                {copied === key
                                                    ? <CheckCheck className="w-3 h-3 text-emerald-500" />
                                                    : <Copy className="w-3 h-3 text-slate-400" />
                                                }
                                            </button>
                                        )}
                                    </div>
                                    {renderValue(value, key)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-lg text-xs font-medium px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

const renderDetails = (details) => {
    if (!details) return <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">No details available.</p>;
    
    if (typeof details !== 'object') {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">{String(details)}</p>
            </div>
        );
    }

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {Object.entries(details).map(([key, value], index) => (
                <div key={key} className={`flex flex-col sm:flex-row sm:items-start p-3 ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'} border-b border-slate-100 dark:border-slate-800 last:border-0`}>
                    <div className="w-full sm:w-1/3 text-sm font-medium text-slate-500 dark:text-slate-400 capitalize pb-1 sm:pb-0">
                        {key.replace(/_/g, ' ')}
                    </div>
                    <div className="w-full sm:w-2/3 text-sm text-slate-900 dark:text-slate-100 break-words">
                        {value === null || value === undefined 
                            ? <span className="text-slate-400 dark:text-slate-500 italic">None</span>
                            : typeof value === 'object' 
                                ? <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                                : isIsoDate(value)
                                    ? formatDateTime(value)
                                    : String(value)
                        }
                    </div>
                </div>
            ))}
        </div>
    );
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    const fetchLogs = (silent = false) => {
        if (!silent) setLoading(true);
        apiFetch("/api/admin/audit-logs")
            .then((res) => res.json())
            .then((data) => {
                setLogs(data || []);
                if (!silent) setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching audit logs:", err);
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        fetchLogs();
        const intervalId = setInterval(() => fetchLogs(true), 5000);
        return () => clearInterval(intervalId);
    }, []);

    const totalPages = Math.max(1, Math.ceil(logs.length / logsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedLogs = logs.slice(
        (safeCurrentPage - 1) * logsPerPage,
        safeCurrentPage * logsPerPage
    );

    return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Audit Log</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                    Review all write operations and system events. Read-only.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-6">
                <div className="border-t sm:border-0 border-slate-100 dark:border-slate-800 overflow-x-auto rounded-lg sm:border sm:dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">User</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Action</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Target</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedLogs.length > 0 ? (
                                paginatedLogs.map((log) => (
                                    <TableRow key={log.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                            {log.user_email || log.user_name || `User ID: ${log.user_id}`}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionVariant(log.action)} className="shadow-none text-[10px] uppercase tracking-wider">
                                                {(log.action || 'unknown').replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-700 dark:text-slate-300 font-mono text-sm">{log.target}</TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                                            {log.details ? (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedLog(log)} 
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 px-2"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </Button>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {!loading && logs.length > logsPerPage && (
                    <div className="flex items-center justify-between px-4 sm:px-0 py-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing {(safeCurrentPage - 1) * logsPerPage + 1}–{Math.min(safeCurrentPage * logsPerPage, logs.length)} of {logs.length} logs
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Prev
                            </Button>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Page {safeCurrentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </Card>
    );
};

export default AuditLog;
