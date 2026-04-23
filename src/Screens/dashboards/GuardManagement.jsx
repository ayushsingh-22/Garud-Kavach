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
import { Input } from "../../Components/ui/input";
import { Button } from "../../Components/ui/button";
import { Search, Plus } from "lucide-react";

const getStatusVariant = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "destructive";
    case "on_leave":
      return "pending";
    default:
      return "outline";
  }
};

const formatStatus = (status) => {
    if (!status) return "";
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const GuardManagement = () => {
    const [guards, setGuards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        apiFetch("/api/guards")
            .then((res) => res.json())
            .then((data) => {
                setGuards(data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching guards:", err);
                setLoading(false);
            });
    }, []);

    const filteredGuards = guards.filter((guard) => 
        (guard.name && guard.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guard.phone && guard.phone.includes(searchTerm))
    );

    return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Guard Management</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Add, edit, and assign guards to client queries.
                    </CardDescription>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-md shadow-orange-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Guard
                </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-6">
                <div className="mb-6 px-4 sm:px-0 relative">
                    <Search className="w-5 h-5 absolute left-7 sm:left-3 top-2.5 text-slate-400" />
                    <Input
                        placeholder="Search guards by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:max-w-md bg-slate-50 dark:bg-slate-950"
                    />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">License Expiry</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        Loading guards...
                                    </TableCell>
                                </TableRow>
                            ) : filteredGuards.length > 0 ? (
                                filteredGuards.map((guard) => {
                                    const expiryDate = guard.license_expiry ? new Date(guard.license_expiry).toLocaleDateString() : 'N/A';
                                    return (
                                    <TableRow key={guard.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{guard.name}</TableCell>
                                        <TableCell className="text-slate-700 dark:text-slate-300">{guard.phone || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">{expiryDate}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(guard.status)} className="shadow-none">
                                                {formatStatus(guard.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                )})
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        No guards found.
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

export default GuardManagement;
