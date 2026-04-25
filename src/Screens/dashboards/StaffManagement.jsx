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
import { Label } from "../../Components/ui/label";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../Components/ui/dialog";

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

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", role: "manager", password: "" });
    const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "manager", password: "" });
    const [formStatus, setFormStatus] = useState({ type: "", msg: "" });

    const fetchStaff = (silent = false) => {
        if (!silent) setLoading(true);
        apiFetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                setStaffMembers(data || []);
                if (!silent) setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching staff:", err);
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        fetchStaff();
        const intervalId = setInterval(() => fetchStaff(true), 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });

        try {
            const res = await apiFetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const resData = await res.json();

            if (res.ok || res.status === 201) {
                setFormStatus({ type: "success", msg: "User added successfully!" });
                setFormData({ name: "", email: "", role: "manager", password: "" });
                fetchStaff();
                setTimeout(() => setIsAddOpen(false), 1000);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to add user." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const confirmDelete = (user) => {
        setSelectedUser(user);
        setFormStatus({ type: "", msg: "" });
        setIsDeleteOpen(true);
    };

    const confirmEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "manager",
            password: ""
        });
        setFormStatus({ type: "", msg: "" });
        setIsEditOpen(true);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });

        const payload = { ...editFormData };
        // If password is empty, don't send it so backend doesn't overwrite it
        if (!payload.password) {
            delete payload.password;
        }

        try {
            const res = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const resData = await res.json().catch(() => ({}));

            if (res.ok) {
                setFormStatus({ type: "success", msg: "User updated successfully!" });
                fetchStaff();
                setTimeout(() => setIsEditOpen(false), 1000);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to update user." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const handleDeleteUser = async () => {
        setFormStatus({ type: "", msg: "" });
        try {
            const res = await apiFetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                setFormStatus({ type: "success", msg: "User deleted successfully!" });
                fetchStaff();
                setTimeout(() => setIsDeleteOpen(false), 1000);
            } else {
                const resData = await res.json().catch(() => ({}));
                setFormStatus({ type: "error", msg: resData.error || "Failed to delete user." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

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
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-md shadow-orange-600/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Add New User</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Create a new administrative account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-900 dark:text-white">Full Name</Label>
                                <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-900 dark:text-white">Email</Label>
                                <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-slate-900 dark:text-white">Role</Label>
                                <select id="role" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-white">
                                    <option value="manager">Manager</option>
                                    <option value="finance">Finance</option>
                                    <option value="hr">HR</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-900 dark:text-white">Password</Label>
                                <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            {formStatus.msg && (
                                <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Save User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
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
                                            <Button variant="ghost" size="sm" onClick={() => confirmEdit(staff)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</Button>
                                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(staff)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</Button>
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

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Edit User</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Update administrative account details. Leave password empty to keep current.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditUser} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-slate-900 dark:text-white">Full Name</Label>
                            <Input id="edit-name" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-slate-900 dark:text-white">Email</Label>
                            <Input id="edit-email" type="email" required value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role" className="text-slate-900 dark:text-white">Role</Label>
                            <select id="edit-role" required value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-white">
                                <option value="superadmin">SuperAdmin</option>
                                <option value="manager">Manager</option>
                                <option value="finance">Finance</option>
                                <option value="hr">HR</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password" className="text-slate-900 dark:text-white">New Password</Label>
                            <Input id="edit-password" type="password" value={editFormData.password} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Leave empty to keep unchanged" />
                        </div>
                        {formStatus.msg && (
                            <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Cancel</Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Delete User</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {formStatus.msg && (
                        <p className={"text-sm py-2 " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                    )}
                    <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default StaffManagement;
