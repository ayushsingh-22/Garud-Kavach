import React, { useEffect, useState } from "react";
import apiFetch from "../utils/apiFetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../Components/ui/table";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from "lucide-react";

const getStatusVariant = (status) => {
  switch (status) {
    case "Resolved":
      return "success";
    case "In Progress":
      return "in_progress";
    case "Rejected":
      return "destructive";
    case "Pending":
    default:
      return "pending";
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Collapsible guard list — shows max 2 in collapsed state
const GuardList = ({ guards }) => {
  const [expanded, setExpanded] = useState(false);
  if (!guards || guards.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-600 italic">None</span>;
  }
  const visible = expanded ? guards : guards.slice(0, 2);
  const hasMore = guards.length > 2;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {visible.map((g, idx) => (
          <span key={`${g.guardId}-${idx}`} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3" />
            {g.guardName}
          </span>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline self-start mt-0.5"
        >
          {expanded ? (
            <>Show less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>+{guards.length - 2} more <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

const QueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [autoAssigning, setAutoAssigning] = useState(null); // queryId being processed
  const [autoAssignError, setAutoAssignError] = useState(null); // { queryId, message }
  const PAGE_SIZE = 10;

  const fetchQueries = (silent = false) => {
    if (!silent) setLoading(true);
    apiFetch("/api/getAllQueries")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        setQueries(sorted);
        if (!silent) setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueries();
    const intervalId = setInterval(() => fetchQueries(true), 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Phase-1: Parse response for assigned guards on status change to "Resolved"
  const handleStatusChange = (id, newStatus) => {
    apiFetch("/api/updateStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setQueries((prev) =>
            prev.map((q) => {
              if (q.id !== id) return q;
              const updated = { ...q, status: newStatus };
              // Clear guards when moving away from Resolved
              if (data.guardsRemoved) {
                updated.assignedGuards = [];
              }
              // Attach assigned guards from auto-assign response
              if (data.assignedGuards) {
                updated.assignedGuards = data.assignedGuards;
              }
              return updated;
            })
          );
          // Show warning if auto-assign found no available guards
          if (data.autoAssignWarning) {
            setAutoAssignError({ queryId: id, message: `⚠️ Auto-assign failed: ${data.autoAssignWarning}. Try assigning manually or pick a different time window.` });
          } else {
            setAutoAssignError(null);
          }
          // Re-fetch to stay in sync with DB
          fetchQueries(true);
        } else {
          console.error("Failed to update status on the server");
        }
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  // Phase-1: Merge assigned guards into local state after manual auto-assign
  const handleAutoAssign = (queryId) => {
    setAutoAssigning(queryId);
    setAutoAssignError(null);
    apiFetch(`/api/queries/${queryId}/auto-assign`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setAutoAssignError(null);
          // Phase-1: update local query with assigned guards and set status to Resolved
          if (data.assignedGuards) {
            setQueries((prev) =>
              prev.map((q) =>
                q.id === queryId ? { ...q, assignedGuards: data.assignedGuards, status: "Resolved" } : q
              )
            );
          }
        } else {
          const errMsg = data.error || "unknown error";
          setAutoAssignError({
            queryId,
            message: errMsg.includes("no available guards")
              ? "⚠️ Auto-assign failed: no available guards for this time window. Try again later or assign manually."
              : `⚠️ Auto-assign failed: ${errMsg}`,
          });
        }
      })
      .catch(() => setAutoAssignError({ queryId, message: "⚠️ Network error during auto-assign. Please check your connection and try again." }))
      .finally(() => setAutoAssigning(null));
  };

  const filteredQueries = queries.filter((query) => {
    const matchesSearch = searchTerm === "" ||
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || query.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredQueries.length / PAGE_SIZE);
  const paginatedQueries = filteredQueries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Client Queries</CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Manage and respond to all incoming client service requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
          <Input
            placeholder="Filter by name, email, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60 border-slate-200 dark:border-slate-800"
          />
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:ring-orange-500">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 z-50 shadow-lg">
              <SelectItem value="All" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">All Statuses</SelectItem>
              <SelectItem value="Pending" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Pending</SelectItem>
              <SelectItem value="In Progress" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">In Progress</SelectItem>
              <SelectItem value="Resolved" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Resolved</SelectItem>
              <SelectItem value="Rejected" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Auto-assign error banner */}
        {autoAssignError && (
          <div className="mx-4 sm:mx-0 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{autoAssignError.message}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Query #{autoAssignError.queryId}</p>
            </div>
            <button
              onClick={() => setAutoAssignError(null)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="border-t border-slate-100 dark:border-slate-800 overflow-visible">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
              <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Service</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">Submitted</TableHead>
                {/* Phase-1: Assigned guards column */}
                <TableHead className="hidden lg:table-cell font-semibold text-slate-700 dark:text-slate-300">Guards</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500 dark:text-slate-400">
                    Loading queries...
                  </TableCell>
                </TableRow>
              ) : paginatedQueries.length > 0 ? (
                paginatedQueries.map((query) => (
                  <TableRow key={query.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{query.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{query.email}</div>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{query.service}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">{formatDateTime(query.submitted_at)}</TableCell>
                    {/* Phase-1: Show assigned guards */}
                    <TableCell className="hidden lg:table-cell">
                      <GuardList guards={query.assignedGuards} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(query.status)} className="shadow-none">{query.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Phase-1: Hide Auto-Assign for Resolved / Rejected queries */}
                        {query.status !== "Resolved" && query.status !== "Rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={autoAssigning === query.id}
                            onClick={() => handleAutoAssign(query.id)}
                            title="Auto-assign nearest available guards to this query"
                            className="h-8 px-2 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            {autoAssigning === query.id ? 'Assigning…' : 'Auto-Assign'}
                          </Button>
                        )}
                        <Select
                          onValueChange={(newStatus) => handleStatusChange(query.id, newStatus)}
                          value={query.status}
                        >
                        <SelectTrigger className="w-[130px] h-8 ml-auto bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="Update..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 z-50 shadow-lg">
                            <SelectItem value="Pending" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Pending</SelectItem>
                            <SelectItem value="In Progress" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">In Progress</SelectItem>
                            <SelectItem value="Resolved" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Resolved</SelectItem>
                            <SelectItem value="Rejected" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500 dark:text-slate-400">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-6 border-t border-slate-100 dark:border-slate-800">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing <strong>{paginatedQueries.length}</strong> of <strong>{filteredQueries.length}</strong> queries
        </div>
        <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                className="h-8 w-8 p-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
            >
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
                Page {currentPage} of {totalPages || 1}
            </span>
            <Button
                variant="outline"
                className="h-8 w-8 p-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || totalPages === 0}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages || totalPages === 0}
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QueryManagement;