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

const getRoleVariant = (role) => {
  switch (role) {
    case "superadmin":
      return "destructive"; // Red-ish for highly privileged
    case "manager":
      return "in_progress"; // Blue
    case "finance":
      return "success"; // Green
    case "hr":
      return "pending"; // Amber
    default:
      return "outline";
  }
};

const StaffManagement = () => {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Fetch staff from the backend admin/users endpoint
        apiFetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                setStaffMembers(data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching staff:", err);
                setLoading(false);
            });
    }, []);

    const filteredStaff = staffMembers.filter((staff) => 
        (staff.name && staff.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Staff Management</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Manage administrative user accounts and roles.
                    </CardDescription>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-md shadow-orange-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New User
                </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-6">
                <div className="mb-6 px-4 sm:px-0 relative">
                    <Search className="w-5 h-5 absolute left-7 sm:left-3 top-2.5 text-slate-400" />
                    <Input
                        placeholder="Search staff by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:max-w-md bg-slate-50 dark:bg-slate-950"
                    />
                </div>
                <div className="border-t sm:border-0 border-slate-100 dark:border-slate-800 overflow-x-auto rounded-lg sm:border sm:dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">User</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Role</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        Loading staff members...
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.length > 0 ? (
                                filteredStaff.map((staff) => (
                                    <TableRow key={staff.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell>
                                            <div className="font-medium text-slate-900 dark:text-slate-100">{staff.name || 'N/A'}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{staff.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleVariant(staff.role)} className="shadow-none uppercase text-[10px] tracking-wider">
                                                {staff.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500`}>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-sm font-medium capitalize">Active</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        No staff members found.
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

export default StaffManagement;
