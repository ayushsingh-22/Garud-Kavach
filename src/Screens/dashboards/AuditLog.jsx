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
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../Components/ui/dialog";

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

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Audit Log Details</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Action: <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">{(selectedLog?.action || '').replace('_', ' ')}</span> on Target: <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog?.target}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 max-h-[60vh] overflow-y-auto">
                        {renderDetails(selectedLog?.details)}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AuditLog;
