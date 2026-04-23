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

const QueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    apiFetch("/api/getAllQueries")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        setQueries(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const handleStatusChange = (id, newStatus) => {
    apiFetch("/api/updateStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    })
      .then((res) => {
        if (res.ok) {
          // Immediately update state on success
          setQueries((prev) =>
            prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
          );
        } else {
          console.error("Failed to update status on the server");
        }
      })
      .catch((err) => console.error("Error updating status:", err));
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
        <div className="border-t border-slate-100 dark:border-slate-800 overflow-visible">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
              <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Service</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">Submitted</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
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
                    <TableCell>
                      <Badge variant={getStatusVariant(query.status)} className="shadow-none">{query.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
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
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || totalPages === 0}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QueryManagement;