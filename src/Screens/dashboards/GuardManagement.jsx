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
import { Search, Plus, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../Components/ui/dialog";

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

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [guardToDelete, setGuardToDelete] = useState(null);
    const [assignQueryId, setAssignQueryId] = useState("");
    
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        license_no: "",
        license_expiry: "",
        status: "active",
        hourly_rate: "0",
        photo: null
    });
    const [formStatus, setFormStatus] = useState({ type: "", msg: "" });

    const fetchGuards = (silent = false) => {
        if (!silent) setLoading(true);
        apiFetch("/api/guards")
            .then((res) => res.json())
            .then((data) => {
                setGuards(data || []);
                if (!silent) setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching guards:", err);
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        fetchGuards();
        const intervalId = setInterval(() => fetchGuards(true), 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleAddGuard = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            const res = await apiFetch("/api/guards", {
                method: "POST",
                // Do not set Content-Type header manually when using FormData
                body: data,
            });
            const resData = await res.json();

            if (res.ok || res.status === 201) {
                setFormStatus({ type: "success", msg: "Guard added successfully!" });
                setFormData({ name: "", phone: "", email: "", license_no: "", license_expiry: "", status: "active", hourly_rate: "0", photo: null });
                fetchGuards();
                setTimeout(() => setIsAddOpen(false), 1000);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to add guard." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const openEditModal = async (guard) => {
        setFormStatus({ type: "", msg: "" });
        let guardDetails = guard;
        try {
            const res = await apiFetch(`/api/guards/${guard.id}`);
            if (res.ok) {
                guardDetails = await res.json();
            }
        } catch (err) {
            console.error("Failed to fetch guard details:", err);
        }

        setSelectedGuard(guardDetails);
        setFormData({
            name: guardDetails.name || "",
            phone: guardDetails.phone || "",
            email: guardDetails.email || "",
            license_no: guardDetails.license_no || "",
            license_expiry: guardDetails.license_expiry ? new Date(guardDetails.license_expiry).toISOString().split('T')[0] : "",
            status: guardDetails.status || "active",
            hourly_rate: guardDetails.hourly_rate || "0",
            photo: null
        });
        setIsEditOpen(true);
    };

    const handleEditGuard = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            const res = await apiFetch(`/api/guards/${selectedGuard.id}`, {
                method: "PUT",
                body: data,
            });
            const resData = await res.json();

            if (res.ok) {
                setFormStatus({ type: "success", msg: "Guard updated successfully!" });
                fetchGuards();
                setTimeout(() => setIsEditOpen(false), 1000);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to update guard." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const openAssignModal = (guard) => {
        setSelectedGuard(guard);
        setAssignQueryId("");
        setFormStatus({ type: "", msg: "" });
        setIsAssignOpen(true);
    };

    const openDeleteModal = (guard) => {
        setGuardToDelete(guard);
        setFormStatus({ type: "", msg: "" });
        setIsDeleteOpen(true);
    };

    const handleAssignGuard = async (e) => {
        e.preventDefault();
        setFormStatus({ type: "", msg: "" });

        try {
            const res = await apiFetch(`/api/guards/${selectedGuard.id}/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query_id: parseInt(assignQueryId, 10) }),
            });
            const resData = await res.json();

            if (res.ok || res.status === 201) {
                setFormStatus({ type: "success", msg: "Guard assigned successfully!" });
                fetchGuards();
                setTimeout(() => setIsAssignOpen(false), 1000);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to assign guard." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const handleDeleteGuard = async () => {
        if (!guardToDelete) return;

        setFormStatus({ type: "", msg: "" });
        try {
            const res = await apiFetch(`/api/guards/${guardToDelete.id}`, {
                method: "DELETE",
            });
            const resData = await res.json().catch(() => ({}));

            if (res.ok) {
                setFormStatus({ type: "success", msg: "Guard deleted successfully!" });
                fetchGuards();
                setTimeout(() => {
                    setIsDeleteOpen(false);
                    setGuardToDelete(null);
                }, 800);
            } else {
                setFormStatus({ type: "error", msg: resData.error || "Failed to delete guard." });
            }
        } catch (err) {
            setFormStatus({ type: "error", msg: "A network error occurred." });
        }
    };

    const isExpiringSoon = (expiryStr) => {
        if (!expiryStr) return false;
        const expiryDate = new Date(expiryStr);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
    };

    const isExpiredOrVerySoon = (expiryStr) => {
        if (!expiryStr) return false;
        const expiryDate = new Date(expiryStr);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    const getLicenseWarning = (expiryStr) => {
        if (!expiryStr) return null;
        const expiryDate = new Date(expiryStr);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "expired";
        if (diffDays <= 7) return "critical";
        if (diffDays <= 30) return "soon";
        return null;
    };

    const filteredGuards = guards.filter((guard) => 
        (guard.name && guard.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guard.phone && guard.phone.includes(searchTerm))
    );

    return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Guard Management</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Add, edit, and assign guards to client queries.
                    </CardDescription>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 shadow-md shadow-orange-600/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Guard
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-y-auto max-h-screen">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Add New Guard</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Create a new guard profile. Upload a photo and set license details.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddGuard} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-900 dark:text-white">Full Name</Label>
                                <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-slate-900 dark:text-white">Phone</Label>
                                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hourly_rate" className="text-slate-900 dark:text-white">Hourly Rate</Label>
                                    <Input id="hourly_rate" type="number" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="license_no" className="text-slate-900 dark:text-white">License No.</Label>
                                    <Input id="license_no" value={formData.license_no} onChange={(e) => setFormData({...formData, license_no: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="license_expiry" className="text-slate-900 dark:text-white">License Expiry</Label>
                                    <Input id="license_expiry" type="date" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white dark:[color-scheme:dark]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="photo" className="text-slate-900 dark:text-white">Photo (Max 5MB)</Label>
                                <Input id="photo" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => setFormData({...formData, photo: e.target.files[0]})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white file:text-white file:bg-slate-700" />
                            </div>
                            {formStatus.msg && (
                                <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Save Guard</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-6">
                <div className="mb-6 px-4 sm:px-0 relative">
                    <Search className="w-5 h-5 absolute left-7 sm:left-3 top-2.5 text-slate-400" />
                    <Input
                        placeholder="Search guards by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:max-w-md bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800"
                    />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-12 text-center">#</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">License</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Assigned Query</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        Loading guards...
                                    </TableCell>
                                </TableRow>
                            ) : filteredGuards.length > 0 ? (
                                filteredGuards.map((guard, index) => {
                                    const expiryDate = guard.license_expiry ? new Date(guard.license_expiry).toLocaleDateString() : 'N/A';
                                    const licenseWarning = getLicenseWarning(guard.license_expiry);
                                    
                                    return (
                                    <TableRow key={guard.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell className="text-center font-medium text-slate-500 dark:text-slate-400">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {guard.photo_url ? (
                                                    <img src={guard.photo_url} alt={guard.name} className="w-8 h-8 rounded-full object-cover bg-slate-100" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <UserPlus className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="font-medium text-slate-900 dark:text-slate-100">{guard.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-700 dark:text-slate-300">{guard.phone || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-sm ${isExpiredOrVerySoon(guard.license_expiry) ? 'text-red-600 dark:text-red-400 font-medium' : isExpiringSoon(guard.license_expiry) ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {expiryDate}
                                                </span>
                                                {licenseWarning === "soon" && (
                                                    <Badge variant="pending" className="shadow-none">Expiring Soon</Badge>
                                                )}
                                                {(licenseWarning === "critical" || licenseWarning === "expired") && (
                                                    <Badge variant="destructive" className="shadow-none">
                                                        {licenseWarning === "expired" ? "Expired" : "Critical"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {guard.assigned_query_id ? (
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-none">
                                                    Query #{guard.assigned_query_id}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(guard.status)} className="shadow-none">
                                                {formatStatus(guard.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(guard)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</Button>
                                            <Button variant="ghost" size="sm" onClick={() => openAssignModal(guard)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 ml-2">Assign</Button>
                                            <Button variant="ghost" size="sm" onClick={() => openDeleteModal(guard)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2">Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                )})
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        No guards found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-y-auto max-h-screen">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Edit Guard</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Update guard profile details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditGuard} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-slate-900 dark:text-white">Full Name</Label>
                            <Input id="edit-name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone" className="text-slate-900 dark:text-white">Phone</Label>
                                <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hourly" className="text-slate-900 dark:text-white">Hourly Rate</Label>
                                <Input id="edit-hourly" type="number" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-licenseno" className="text-slate-900 dark:text-white">License No.</Label>
                                <Input id="edit-licenseno" value={formData.license_no} onChange={(e) => setFormData({...formData, license_no: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-licenseexp" className="text-slate-900 dark:text-white">License Expiry</Label>
                                <Input id="edit-licenseexp" type="date" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white dark:[color-scheme:dark]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status" className="text-slate-900 dark:text-white">Status</Label>
                            <select id="edit-status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors text-slate-900 dark:text-white">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="on_leave">On Leave</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-photo" className="text-slate-900 dark:text-white">New Photo (Max 5MB)</Label>
                            <Input id="edit-photo" type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => setFormData({...formData, photo: e.target.files[0]})} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white file:text-white file:bg-slate-700" />
                        </div>
                        {formStatus.msg && (
                            <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Update Guard</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Assign Guard to Query</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Assign {selectedGuard?.name} to an existing query.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignGuard} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="query_id" className="text-slate-900 dark:text-white">Query ID</Label>
                            <Input id="query_id" type="number" required value={assignQueryId} onChange={(e) => setAssignQueryId(e.target.value)} placeholder="e.g. 10" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                        </div>
                        {formStatus.msg && (
                            <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={loading || !assignQueryId} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Assign Guard</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Delete Guard</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete {guardToDelete?.name}? This action will remove the guard from active records.
                        </DialogDescription>
                    </DialogHeader>
                    {formStatus.msg && (
                        <p className={"text-sm " + (formStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500')}>{formStatus.msg}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteGuard}>Delete Guard</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default GuardManagement;
