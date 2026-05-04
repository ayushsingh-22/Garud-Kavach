import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, X, BellOff, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';
import { useAuth } from '../contexts/AuthContext';

const typeConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', ring: 'ring-blue-200 dark:ring-blue-500/20', gradient: 'from-blue-500 to-blue-600' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-200 dark:ring-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-200 dark:ring-emerald-500/20', gradient: 'from-emerald-500 to-green-600' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', ring: 'ring-red-200 dark:ring-red-500/20', gradient: 'from-red-500 to-rose-600' },
    // Phase-2: SOS-specific urgent notification styling
    sos: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', ring: 'ring-red-300 dark:ring-red-500/30', gradient: 'from-red-600 to-rose-700' },
};

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByTime(notifications) {
    const now = new Date();
    const groups = { today: [], earlier: [] };
    notifications.forEach(n => {
        const date = new Date(n.created_at);
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (diffHours < 24) groups.today.push(n);
        else groups.earlier.push(n);
    });
    return groups;
}

function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dismissing, setDismissing] = useState(new Set());
    const intervalRef = useRef(null);
    const panelRef = useRef(null);
    const bellRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await apiFetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
            }
        } catch {
            // silently ignore
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                open &&
                panelRef.current && !panelRef.current.contains(e.target) &&
                bellRef.current && !bellRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleEsc(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        if (open) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [open]);

    const markAllRead = async () => {
        if (notifications.length === 0) return;
        setLoading(true);
        const ids = notifications.map((n) => n.id);
        try {
            const res = await apiFetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            if (res.ok) setNotifications([]);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    const dismissOne = async (id) => {
        setDismissing(prev => new Set(prev).add(id));
        try {
            const res = await apiFetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            if (res.ok) {
                // Animate out then remove
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                    setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
                }, 300);
            }
        } catch {
            setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
        }
    };

    // Map notification to a dashboard section based on type and message content
    const getNotificationTarget = (n) => {
        const msg = (n.message || '').toLowerCase();
        const type = (n.type || '').toLowerCase();

        if (type === 'sos' || msg.includes('sos')) return 'tracking';
        if (msg.includes('incident')) return 'tracking';
        if (msg.includes('shift') || msg.includes('schedule')) return 'guards';
        if (type === 'shift') return 'guards';
        if (msg.includes('query') || msg.includes('request') || msg.includes('assigned') || msg.includes('status')) return 'queries';
        if (msg.includes('guard')) return 'queries';
        return 'queries'; // default
    };

    const handleNotificationClick = (n) => {
        const section = getNotificationTarget(n);
        dismissOne(n.id);
        setOpen(false);
        navigate(`/dashboard?section=${section}`);
    };



    if (!user) return null;

    const count = notifications.length;
    const groups = groupByTime(notifications);

    const renderNotification = (n) => {
        const config = typeConfig[n.type] || typeConfig.info;
        const Icon = config.icon;
        const isDismissing = dismissing.has(n.id);

        return (
            <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative flex items-start gap-3 px-4 py-3.5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${isDismissing ? 'opacity-0 -translate-x-4 max-h-0 py-0 overflow-hidden' : 'opacity-100 translate-x-0'}`}
            >
                {/* Type indicator line */}
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b ${config.gradient}`} />

                {/* Icon */}
                <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${config.bg} ring-1 ${config.ring}`}>
                    <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 line-clamp-2">
                        {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            {timeAgo(n.created_at)}
                        </p>
                        <span className="text-[10px] text-orange-500 dark:text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            View <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                    </div>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); dismissOne(n.id); }}
                    className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                ref={bellRef}
                onClick={() => setOpen(prev => !prev)}
                className={`relative p-2 rounded-xl transition-all duration-200 ${open ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
                aria-expanded={open}
            >
                <Bell className={`w-5 h-5 transition-transform duration-200 ${count > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`} />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-950">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200 dark:border-slate-700/80 flex flex-col overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                    role="dialog"
                    aria-label="Notifications"
                >
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Notifications
                            </h2>
                            <div className="flex items-center gap-1">
                                {count > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                        Clear all
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {count > 0 ? `${count} unread notification${count > 1 ? 's' : ''}` : 'You\'re all caught up'}
                        </p>
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {count === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 ring-1 ring-slate-100 dark:ring-slate-700">
                                    <BellOff className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    No notifications yet
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center max-w-[220px]">
                                    When something important happens, you'll see it here.
                                </p>
                            </div>
                        ) : (
                            <>
                                {groups.today.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Today
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {groups.today.map(renderNotification)}
                                        </div>
                                    </div>
                                )}
                                {groups.earlier.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Earlier
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {groups.earlier.map(renderNotification)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}

export default NotificationBell;
