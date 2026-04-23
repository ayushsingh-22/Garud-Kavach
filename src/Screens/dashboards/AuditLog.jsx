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

const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
};

const getActionVariant = (action) => {
    if (!action) return 'default';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create') || action.includes('assign')) return 'success';
    if (action.includes('update')) return 'in_progress';
    return 'default';
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch("/api/admin/audit-logs")
            .then((res) => res.json())
            .then((data) => {
                setLogs(data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching audit logs:", err);
                setLoading(false);
            });
    }, []);

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
                            ) : logs.length > 0 ? (
                                logs.map((log) => (
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
                                            {log.details ? JSON.stringify(log.details) : '-'}
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
            </CardContent>
        </Card>
    );
};

export default AuditLog;
