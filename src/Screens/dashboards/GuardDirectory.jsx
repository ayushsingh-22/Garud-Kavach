import React, { useState, useEffect } from 'react';
import apiFetch from "../../utils/apiFetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card";
import { Badge } from "../../Components/ui/badge";
import { Input } from "../../Components/ui/input";
import { Button } from "../../Components/ui/button";
import { Dialog, DialogContent } from "../../Components/ui/dialog";
import { Search, Shield, Phone, Mail, MapPin, Calendar, CreditCard, Clock, ChevronLeft, ChevronRight, UserPlus, X, Users, AlertTriangle, Briefcase, IndianRupee } from 'lucide-react';

const statusConfig = {
    active:   { label: 'Active',   dotCls: 'bg-emerald-500', badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40' },
    inactive: { label: 'Inactive', dotCls: 'bg-red-500',     badgeCls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-700/40' },
    on_leave: { label: 'On Leave', dotCls: 'bg-amber-500',   badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-700/40' },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getLicenseStatus = (expiryStr) => {
    if (!expiryStr) return null;
    const diff = Math.ceil((new Date(expiryStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff <= 7) return 'critical';
    if (diff <= 30) return 'warning';
    return 'ok';
};

const CARDS_PER_PAGE = 12;

const GuardDirectory = () => {
    const [guards, setGuards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [detailGuard, setDetailGuard] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchGuards = (silent = false) => {
        if (!silent) setLoading(true);
        apiFetch('/api/guards')
            .then(res => res.json())
            .then(data => {
                setGuards(Array.isArray(data) ? data : []);
                if (!silent) setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching guards:', err);
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        fetchGuards();
        const interval = setInterval(() => fetchGuards(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const openDetail = async (guard) => {
        setSelectedGuard(guard);
        setDetailLoading(true);
        try {
            const res = await apiFetch(`/api/guards/${guard.id}`);
            if (res.ok) {
                setDetailGuard(await res.json());
            } else {
                setDetailGuard(guard);
            }
        } catch {
            setDetailGuard(guard);
        }
        setDetailLoading(false);
    };

    const closeDetail = () => {
        setSelectedGuard(null);
        setDetailGuard(null);
    };

    const filtered = guards.filter(g => {
        const matchesSearch = !searchTerm ||
            (g.name && g.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (g.license_no && g.license_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (g.phone && g.phone.includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const activeCount = guards.filter(g => g.status === 'active').length;
    const inactiveCount = guards.filter(g => g.status === 'inactive').length;
    const onLeaveCount = guards.filter(g => g.status === 'on_leave').length;
    const expiringCount = guards.filter(g => {
        const ls = getLicenseStatus(g.license_expiry);
        return ls === 'warning' || ls === 'critical' || ls === 'expired';
    }).length;

    // Avatar component — handles photo with fallback cleanly
    const GuardAvatar = ({ guard, size = 'sm' }) => {
        const [imgError, setImgError] = useState(false);
        const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-11 h-11 text-sm';
        const borderCls = size === 'lg' ? 'border-2 border-white/30' : '';

        if (guard.photo_url && !imgError) {
            return (
                <img
                    src={guard.photo_url}
                    alt={guard.name}
                    onError={() => setImgError(true)}
                    className={`${sz} rounded-full object-cover flex-shrink-0 ${borderCls || 'bg-slate-200 dark:bg-slate-700'} ${size === 'lg' ? 'bg-white/10' : ''}`}
                />
            );
        }
        return (
            <div className={`${sz} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${borderCls} ${
                size === 'lg'
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
            }`}>
                {guard.name ? guard.name.charAt(0).toUpperCase() : '?'}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Guards', value: guards.length, icon: Users, textCls: 'text-slate-800 dark:text-slate-200', iconBg: 'bg-slate-100 dark:bg-slate-800', iconCls: 'text-slate-500 dark:text-slate-400', bgCls: 'bg-white dark:bg-slate-900' },
                    { label: 'Active', value: activeCount, icon: Shield, textCls: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-500/15', iconCls: 'text-emerald-600 dark:text-emerald-400', bgCls: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Inactive / Leave', value: inactiveCount + onLeaveCount, icon: Clock, textCls: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-500/15', iconCls: 'text-amber-600 dark:text-amber-400', bgCls: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'License Alerts', value: expiringCount, icon: AlertTriangle, textCls: expiringCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400', iconBg: expiringCount > 0 ? 'bg-red-100 dark:bg-red-500/15' : 'bg-slate-100 dark:bg-slate-800', iconCls: expiringCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500', bgCls: expiringCount > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-slate-800/50' },
                ].map(({ label, value, icon: Icon, textCls, iconBg, iconCls, bgCls }) => (
                    <div key={label} className={`${bgCls} rounded-xl border border-slate-200 dark:border-slate-800 p-4`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${iconCls}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${textCls}`}>{value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-slate-900 dark:text-white">Guard Directory</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Quick overview of all guards — click a card for full details.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'active', label: 'Active' },
                                { key: 'inactive', label: 'Inactive' },
                                { key: 'on_leave', label: 'On Leave' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                        statusFilter === f.key
                                            ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-800'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative mt-4">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                        <Input
                            placeholder="Search by name, license no, or phone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 w-full sm:max-w-md bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60"
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent" />
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className="text-center py-16">
                            <Shield className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">No guards found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting the search or filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginated.map(guard => {
                                const sc = statusConfig[guard.status] || statusConfig.inactive;
                                const ls = getLicenseStatus(guard.license_expiry);
                                return (
                                    <button
                                        key={guard.id}
                                        onClick={() => openDetail(guard)}
                                        className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md hover:shadow-orange-600/5 transition-all duration-200 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <GuardAvatar guard={guard} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                        {guard.name}
                                                    </p>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${sc.badgeCls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`} />
                                                        {sc.label}
                                                    </span>
                                                </div>

                                                <div className="mt-2 space-y-1.5">
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>Joined {formatDate(guard.created_at)}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs ${
                                                        ls === 'expired' ? 'text-red-600 dark:text-red-400 font-medium'
                                                        : ls === 'critical' ? 'text-red-500 dark:text-red-400 font-medium'
                                                        : ls === 'warning' ? 'text-amber-600 dark:text-amber-400 font-medium'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate">
                                                            License {ls === 'expired' ? 'Expired' : `Expires ${formatDate(guard.license_expiry)}`}
                                                        </span>
                                                        {(ls === 'expired' || ls === 'critical') && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > CARDS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Showing {(safePage - 1) * CARDS_PER_PAGE + 1}–{Math.min(safePage * CARDS_PER_PAGE, filtered.length)} of {filtered.length} guards
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">{safePage} / {totalPages}</span>
                                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedGuard} onOpenChange={open => { if (!open) closeDetail(); }}>
                <DialogContent showCloseButton={false} className="sm:max-w-[480px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 !p-0 !gap-0 overflow-hidden overflow-y-auto max-h-[90vh]">
                    {detailLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent" />
                        </div>
                    ) : detailGuard ? (() => {
                        const g = detailGuard;
                        const sc = statusConfig[g.status] || statusConfig.inactive;
                        const ls = getLicenseStatus(g.license_expiry);

                        return (
                            <div className="flex flex-col">
                                {/* Header banner */}
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 px-4 sm:px-6 pt-5 pb-14 relative">
                                    <button
                                        onClick={closeDetail}
                                        aria-label="Close"
                                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white/90 hover:text-white transition-all z-10"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <GuardAvatar guard={g} size="lg" />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-bold text-white truncate">{g.name}</h3>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5 bg-white/15 text-white/90 border border-white/10">
                                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`} />
                                                {sc.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details card overlapping banner */}
                                <div className="px-3 sm:px-4 -mt-8 pb-5 relative">
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-black/20 divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {/* Phone */}
                                        <div className="px-4 py-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Phone</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white pl-[22px]">{g.phone || '—'}</p>
                                        </div>

                                        {/* Email */}
                                        <div className="px-4 py-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Email</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white pl-[22px] break-all">{g.email || '—'}</p>
                                        </div>

                                        {/* Address */}
                                        <div className="px-4 py-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Address</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white pl-[22px]">{g.address || '—'}</p>
                                        </div>

                                        {/* License No & Expiry — 2 column on wider, stacked on mobile */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-700/50">
                                            <div className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">License No.</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white pl-[22px]">{g.license_no || '—'}</p>
                                            </div>
                                            <div className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">License Expiry</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-[22px]">
                                                    <span className={`text-sm font-medium ${
                                                        ls === 'expired' ? 'text-red-600 dark:text-red-400' :
                                                        ls === 'critical' ? 'text-red-500 dark:text-red-400' :
                                                        ls === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-slate-900 dark:text-white'
                                                    }`}>{formatDate(g.license_expiry)}</span>
                                                    {ls === 'expired' && <Badge className="shadow-none text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-700/40">Expired</Badge>}
                                                    {(ls === 'critical' || ls === 'warning') && <Badge className="shadow-none text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-700/40">{ls === 'critical' ? 'Soon' : 'Expiring'}</Badge>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Joined & Hourly Rate — 2 column */}
                                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700/50">
                                            <div className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Joined</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white pl-[22px]">{formatDate(g.created_at)}</p>
                                            </div>
                                            <div className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Rate/hr</span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white pl-[22px]">₹{Number(g.hourly_rate || 0).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        {/* Assignment */}
                                        <div className="px-4 py-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Assignment</span>
                                            </div>
                                            <p className={`text-sm font-medium pl-[22px] ${
                                                g.assigned_query_id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                                {g.assigned_query_id ? `Query #${g.assigned_query_id}` : 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })() : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GuardDirectory;
