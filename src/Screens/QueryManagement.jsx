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
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../Components/ui/dialog";
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
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  MessageSquare,
  Camera,
  Car,
  Cross,
  Radio,
  Flame,
  IndianRupee,
  CheckCircle2,
  XCircle,
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
  const [selectedQuery, setSelectedQuery] = useState(null); // query detail modal
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
          // Sync popup detail view with status/guard changes
          setSelectedQuery((prev) => {
            if (!prev || prev.id !== id) return prev;
            const updated = { ...prev, status: newStatus };
            if (data.guardsRemoved) updated.assignedGuards = [];
            if (data.assignedGuards) updated.assignedGuards = data.assignedGuards;
            return updated;
          });
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
            // Update the popup detail view with assigned guards
            setSelectedQuery((prev) =>
              prev && prev.id === queryId
                ? { ...prev, assignedGuards: data.assignedGuards, status: "Resolved" }
                : prev
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
                  <TableRow key={query.id} className="border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setSelectedQuery(query)}>
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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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

      {/* ─── Query Detail Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!selectedQuery} onOpenChange={(open) => !open && setSelectedQuery(null)}>
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" showCloseButton={false}>
          {selectedQuery && (
            <>
              {/* ── Header with avatar & status ── */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
                    {selectedQuery.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogHeader className="gap-1">
                      <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                        {selectedQuery.name}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{selectedQuery.id}</span>
                        <span>&middot;</span>
                        <span>{selectedQuery.service}</span>
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <Badge variant={getStatusVariant(selectedQuery.status)} className="shadow-none flex-shrink-0 mt-1">{selectedQuery.status}</Badge>
                  <DialogClose asChild>
                    <button className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </DialogClose>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* ── Contact Information ── */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{selectedQuery.email}</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{selectedQuery.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* ── Deployment Parameters ── */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Deployment Parameters</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { icon: Shield, label: "Service Type", value: selectedQuery.service },
                      { icon: UserCheck, label: "Guards Required", value: `${selectedQuery.numGuards || "1"} Guards` },
                      { icon: Clock, label: "Duration", value: `${selectedQuery.durationValue || "—"} ${selectedQuery.durationType || ""}` },
                      { icon: Calendar, label: "Submitted", value: formatDateTime(selectedQuery.submitted_at) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3 px-3 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Equipment Status ── */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Equipment Status</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Camera", value: selectedQuery.cameraRequired, icon: Camera },
                      { label: "Vehicle", value: selectedQuery.vehicleRequired, icon: Car },
                      { label: "First Aid", value: selectedQuery.firstAid, icon: Cross },
                      { label: "Radio", value: selectedQuery.walkieTalkie, icon: Radio },
                      { label: "Armor", value: selectedQuery.bulletProof, icon: Shield },
                      { label: "Fire Safe", value: selectedQuery.fireSafety, icon: Flame },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                          item.value
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/60"
                            : "bg-slate-50 text-slate-400 border-slate-150 dark:bg-slate-800/30 dark:text-slate-500 dark:border-slate-700/50"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.value ? <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-50" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Client Message ── */}
                {selectedQuery.message && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Client Message</h4>
                    <div className="relative rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 dark:bg-orange-500" />
                      <div className="flex gap-3 p-4 pl-5">
                        <MessageSquare className="w-4 h-4 text-orange-400 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap italic">"{selectedQuery.message}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Cost & Status Bar ── */}
                <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={getStatusVariant(selectedQuery.status)} className="shadow-none">{selectedQuery.status}</Badge>
                  </div>
                  {selectedQuery.cost > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Est. Cost</span>
                      <IndianRupee className="w-4 h-4 text-orange-500" />
                      <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{selectedQuery.cost.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* ── Assigned Guards ── */}
                {selectedQuery.assignedGuards && selectedQuery.assignedGuards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Assigned Commanders</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuery.assignedGuards.map((g, idx) => (
                        <div
                          key={`${g.guardId}-${idx}`}
                          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {g.guardName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Action Footer ── */}
              <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* Status Change */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline">Status</span>
                    <Select
                      value={selectedQuery.status}
                      onValueChange={(val) => {
                        handleStatusChange(selectedQuery.id, val);
                        setSelectedQuery((prev) => prev ? { ...prev, status: val } : prev);
                      }}
                    >
                      <SelectTrigger className="w-[170px] h-9 text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 focus:ring-orange-500/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            selectedQuery.status === 'Resolved' ? 'bg-emerald-500' :
                            selectedQuery.status === 'In Progress' ? 'bg-blue-500' :
                            selectedQuery.status === 'Rejected' ? 'bg-red-500' :
                            'bg-amber-500'
                          }`} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1 text-slate-700 dark:text-slate-100">
                        {[
                          { value: "Pending", color: "bg-amber-500", label: "Pending" },
                          { value: "In Progress", color: "bg-blue-500", label: "In Progress" },
                          { value: "Resolved", color: "bg-emerald-500", label: "Resolved" },
                          { value: "Rejected", color: "bg-red-500", label: "Rejected" },
                        ].map((s) => (
                          <SelectItem
                            key={s.value}
                            value={s.value}
                            className="rounded-lg text-sm font-medium text-slate-700 dark:text-slate-100 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto Assign */}
                  {selectedQuery.status !== "Resolved" && selectedQuery.status !== "Rejected" && (
                    <Button
                      size="sm"
                      className="h-9 gap-1.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200"
                      disabled={autoAssigning === selectedQuery.id}
                      onClick={() => {
                        handleAutoAssign(selectedQuery.id);
                        setSelectedQuery((prev) => prev ? { ...prev, status: "Resolved" } : prev);
                      }}
                    >
                      <UserCheck className="w-4 h-4" />
                      {autoAssigning === selectedQuery.id ? "Assigning..." : "Auto Assign"}
                    </Button>
                  )}

                  <div className="flex-1" />

                  {/* Close */}
                  <DialogClose asChild>
                    <Button variant="outline" size="sm" className="h-9 px-5 text-sm font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      Close
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QueryManagement;