import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from "../../utils/apiFetch";
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from "../../Components/ui/card";
import { Badge } from "../../Components/ui/badge";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Label } from "../../Components/ui/label";
import {
    ClipboardList,
    PlusCircle,
    User,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Clock,
    Loader2,
    Shield,
    TrendingUp,
    Activity,
    Lock,
    Eye,
    Car,
    Zap,
    Flame,
    Radio,
    Camera,
    LayoutDashboard,
    Mail,
    Phone as PhoneIcon,
    Building2,
    MapPin,
    Calendar,
    BadgeCheck,
    Pencil,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    IndianRupee,
    Users,
    Timer,
    MessageSquare,
    ShieldCheck,
    CircleDot,
} from 'lucide-react';

// ─── Status Config ────────────────────────────────────────────────
const statuses = ['Pending', 'In Progress', 'Resolved'];

const statusConfig = {
    Pending: {
        dot: 'bg-slate-400 dark:bg-slate-500',
        text: 'text-slate-500 dark:text-slate-400',
        badge: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        bar: 'bg-slate-400 dark:bg-slate-600',
    },
    'In Progress': {
        dot: 'bg-blue-500 dark:bg-blue-400',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        bar: 'bg-blue-500',
    },
    Resolved: {
        dot: 'bg-emerald-500 dark:bg-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
        bar: 'bg-emerald-500',
    },
    Rejected: {
        dot: 'bg-red-500 dark:bg-red-400',
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        bar: 'bg-red-500',
    },
};

// ─── Status Timeline ────────────────────────────────────────────────
const StatusTimeline = ({ current }) => {
    const currentIndex = statuses.indexOf(current);
    return (
        <div className="flex items-center gap-0 py-4 px-2">
            {statuses.map((s, i) => {
                const isPast = i < currentIndex;
                const isCurrent = i === currentIndex;
                return (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                isPast
                                    ? 'bg-emerald-500 border-emerald-400 text-white'
                                    : isCurrent
                                    ? 'bg-orange-500 border-orange-400 text-white'
                                    : 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                            }`}>
                                {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium tracking-wide ${
                                isCurrent ? 'text-orange-600 dark:text-orange-500' : isPast ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'
                            }`}>{s}</span>
                        </div>
                        {i < statuses.length - 1 && (
                            <div className="flex-1 h-px mx-1 relative -mt-5">
                                <div className="h-full bg-slate-200 dark:bg-slate-800 absolute inset-0" />
                                <div className={`h-full absolute inset-0 transition-all duration-500 ${i < currentIndex ? 'bg-emerald-500' : 'bg-transparent'}`} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── My Bookings Tab ─────────────────────────────────────────────
const MyBookings = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchQueries = async () => {
            try {
                const res = await apiFetch('/api/customer/queries');
                if (res.ok) setQueries(await res.json());
            } catch (err) {
                console.error('Failed to fetch bookings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQueries();
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                <span className="text-slate-500 dark:text-slate-400 text-sm">Loading bookings…</span>
            </div>
        </div>
    );

    if (queries.length === 0) return (
        <div className="text-center py-20 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5">
                <ClipboardList className="w-9 h-9 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No bookings yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Submit a new booking to get started.</p>
        </div>
    );

    return (
        <div className="space-y-2">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 border-b border-slate-200 dark:border-slate-800">
                <span className="col-span-4">Service</span>
                <span className="col-span-2">Guards</span>
                <span className="col-span-3">Submitted</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-1"></span>
            </div>

            {queries.map((q) => {
                const cfg = statusConfig[q.status] || statusConfig.Pending;
                const isOpen = expandedId === q.id;
                return (
                    <div
                        key={q.id}
                        className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                            isOpen
                                ? 'bg-white dark:bg-slate-900 border-orange-300 dark:border-orange-500/30 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        onClick={() => setExpandedId(isOpen ? null : q.id)}
                    >
                        {/* Left accent bar */}
                        <div className={`h-0.5 w-full ${cfg.bar} opacity-60`} />

                        <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-center px-5 py-4">
                            <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                <span className="font-semibold text-slate-900 dark:text-white text-sm">{q.service || 'N/A'}</span>
                            </div>
                            <div className="col-span-1 md:col-span-2 text-sm text-slate-500 dark:text-slate-400">
                                {q.numGuards || '1'} guard{(q.numGuards || 1) > 1 ? 's' : ''}
                            </div>
                            <div className="hidden md:block col-span-3 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(q.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                    {q.status}
                                </span>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </div>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800">
                                <StatusTimeline current={q.status} />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                    {[
                                        { label: 'Duration', value: `${q.durationValue || '—'} ${q.durationType || ''}` },
                                        { label: 'Cost', value: `₹${(q.cost || 0).toLocaleString('en-IN')}` },
                                        { label: 'Submitted', value: new Date(q.submitted_at).toLocaleDateString('en-IN') },
                                        q.message && { label: 'Note', value: q.message },
                                    ].filter(Boolean).map((item) => (
                                        <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{item.label}</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Service Icons Map ────────────────────────────────────────────
const serviceIcons = {
    'Bodyguard Services': Shield,
    'Transport Security': Car,
    'Corporate Guards': Lock,
    'Society Guards': Eye,
    'Event Security': Zap,
    'CCTV Surveillance': Camera,
};

const serviceDescriptions = {
    'Bodyguard Services': 'Personal protection detail',
    'Transport Security': 'Secure convoy & escort',
    'Corporate Guards': 'Office & premises security',
    'Society Guards': 'Residential complex security',
    'Event Security': 'Crowd & venue management',
    'CCTV Surveillance': 'Monitoring & surveillance',
};

// ─── New Booking (3-step wizard) ─────────────────────────────────
const serviceOptions = Object.keys(serviceIcons);

const addOnKeys = [
    { key: 'cameraRequired', label: 'CCTV Camera', icon: Camera, cost: 500 },
    { key: 'vehicleRequired', label: 'Vehicle', icon: Car, cost: 2500 },
    { key: 'firstAid', label: 'First Aid Kit', icon: Activity, cost: 150 },
    { key: 'walkieTalkie', label: 'Walkie Talkie', icon: Radio, cost: 500 },
    { key: 'bulletProof', label: 'Bulletproof Vest', icon: Shield, cost: 2000 },
    { key: 'fireSafety', label: 'Fire Safety', icon: Flame, cost: 750 },
];

const NewBooking = ({ onSubmitSuccess }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        name: '', email: '', phone: '', service: '',
        numGuards: '1', durationType: 'hours', durationValue: '',
        cameraRequired: false, vehicleRequired: false, firstAid: false,
        walkieTalkie: false, bulletProof: false, fireSafety: false, message: '',
    });

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const res = await apiFetch('/api/customer/profile');
                    if (res.ok) {
                        const profile = await res.json();
                        setForm((prev) => ({ ...prev, name: profile.name || '', email: profile.email || '', phone: profile.phone || '' }));
                    }
                } catch {}
            };
            fetchProfile();
        }
    }, [user]);

    const estimatedCost = (() => {
        const optionalCosts = { cameraRequired: 500, vehicleRequired: 2500, firstAid: 150, walkieTalkie: 500, bulletProof: 2000, fireSafety: 750 };
        let cost = (parseInt(form.numGuards) || 1) * 1000;
        Object.entries(optionalCosts).forEach(([key, val]) => { if (form[key]) cost += val; });
        cost += 1000;
        return Math.round(cost * 1.18);
    })();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await apiFetch('/api/add-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, cost: estimatedCost }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => { setSuccess(false); onSubmitSuccess?.(); }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to submit booking');
            }
        } catch { setError('Network error. Please try again.'); }
        finally { setSubmitting(false); }
    };

    if (success) return (
        <div className="text-center py-16 flex flex-col items-center animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Booking Submitted!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Our security team will review your request and reach out within 24 hours.</p>
            <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Confirmation email sent</span>
            </div>
        </div>
    );

    const stepLabels = ['Select Service', 'Your Details', 'Confirm'];
    const selectedAddOns = addOnKeys.filter(({ key }) => form[key]);

    return (
        <div className="max-w-3xl mx-auto">
            {/* Step indicator - pill style */}
            <div className="mb-10">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
                    {stepLabels.map((label, i) => {
                        const isActive = step === i + 1;
                        const isPast = step > i + 1;
                        return (
                            <button
                                key={label}
                                onClick={() => { if (isPast) setStep(i + 1); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                                        : isPast
                                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 cursor-pointer'
                                        : 'text-slate-400 dark:text-slate-600 cursor-default'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                    isActive ? 'bg-white/20 text-white' : isPast ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                }`}>
                                    {isPast ? <CheckCircle className="w-3 h-3" /> : i + 1}
                                </div>
                                <span className="hidden sm:block">{label}</span>
                            </button>
                        );
                    })}
                </div>
                {/* Progress bar underneath */}
                <div className="mt-3 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 2) * 100}%` }} />
                </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Choose a Service</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the type of security service you require.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {serviceOptions.map((svc, idx) => {
                            const Icon = serviceIcons[svc];
                            const isSelected = form.service === svc;
                            const popularServices = ['Bodyguard Services', 'Corporate Guards'];
                            const isPopular = popularServices.includes(svc);
                            return (
                                <button
                                    key={svc}
                                    type="button"
                                    onClick={() => setForm((prev) => ({ ...prev, service: svc }))}
                                    className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${
                                        isSelected
                                            ? 'border-orange-300 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-500/5 shadow-md shadow-orange-500/10 ring-1 ring-orange-200 dark:ring-orange-500/20'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                                    }`}
                                >
                                    {/* Top accent bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-0.5 transition-all ${
                                        isSelected ? 'bg-gradient-to-r from-orange-400 to-amber-400' : 'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                                    }`} />

                                    {isPopular && !isSelected && (
                                        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400">
                                            Popular
                                        </span>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                            isSelected
                                                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm shadow-orange-500/20'
                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold transition-colors ${
                                                isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-200'
                                            }`}>{svc}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{serviceDescriptions[svc]}</p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-500">
                                                <CheckCircle className="w-3.5 h-3.5" /> Selected
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-600">Starting ₹1,000</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-slate-400 dark:text-slate-600">
                            {form.service ? <span className="text-slate-600 dark:text-slate-300">Selected: <strong className="text-orange-600 dark:text-orange-500">{form.service}</strong></span> : '6 services available'}
                        </p>
                        <button
                            disabled={!form.service}
                            onClick={() => setStep(2)}
                            className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm shadow-orange-500/20"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div className="space-y-5">
                    {/* Service selected banner */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20">
                        {serviceIcons[form.service] && React.createElement(serviceIcons[form.service], { className: 'w-5 h-5 text-orange-500' })}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{form.service}</p>
                            <p className="text-[10px] text-orange-500/70 dark:text-orange-500/50">{serviceDescriptions[form.service]}</p>
                        </div>
                        <button onClick={() => setStep(1)} className="text-[10px] font-medium text-orange-500 hover:text-orange-600 underline underline-offset-2">Change</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Left: Form fields */}
                        <div className="lg:col-span-3 space-y-5">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Contact Information</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { name: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe' },
                                        { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'john@example.com' },
                                        { name: 'phone', label: 'Phone Number', type: 'tel', icon: PhoneIcon, placeholder: '+91 98765 43210' },
                                        { name: 'numGuards', label: 'Number of Guards', type: 'number', min: 1, icon: Users, placeholder: '1' },
                                    ].map(({ name, label, type, min, icon: FieldIcon, placeholder }) => (
                                        <div key={name} className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                <FieldIcon className="w-3 h-3" /> {label}
                                            </label>
                                            <input
                                                name={name}
                                                type={type}
                                                min={min}
                                                placeholder={placeholder}
                                                value={form[name]}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <Timer className="w-3 h-3" /> Duration
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            name="durationValue"
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 8"
                                            value={form.durationValue}
                                            onChange={handleChange}
                                            required
                                            className="flex-1 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                                        />
                                        <select
                                            name="durationType"
                                            value={form.durationType}
                                            onChange={handleChange}
                                            className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                                        >
                                            <option value="hours">Hours</option>
                                            <option value="months">Months</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Add-ons */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Optional Add-ons</p>
                                    </div>
                                    {selectedAddOns.length > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                            {selectedAddOns.length} selected
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {addOnKeys.map(({ key, label, icon: Icon, cost }) => (
                                        <label
                                            key={key}
                                            className={`relative flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                                                form[key]
                                                    ? 'border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400 shadow-sm shadow-orange-500/5'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} className="hidden" />
                                            {/* Checkmark indicator */}
                                            <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                                form[key] ? 'bg-orange-500 text-white scale-100' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 scale-90'
                                            }`}>
                                                {form[key] && <CheckCircle className="w-3 h-3" />}
                                            </div>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                form[key] ? 'bg-orange-100 dark:bg-orange-500/15' : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold">{label}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-600">+₹{cost.toLocaleString('en-IN')}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <MessageSquare className="w-3 h-3" /> Additional Notes (Optional)
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any special requirements or instructions…"
                                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Right: Live cost estimator */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Cost Estimate</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {/* Line items */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400">Base ({form.numGuards || 1} guard{(parseInt(form.numGuards) || 1) > 1 ? 's' : ''})</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-200">₹{((parseInt(form.numGuards) || 1) * 1000).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400">Service fee</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-200">₹1,000</span>
                                        </div>
                                        {selectedAddOns.map(({ key, label, cost }) => (
                                            <div key={key} className="flex justify-between items-center">
                                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <CircleDot className="w-2.5 h-2.5 text-orange-400" /> {label}
                                                </span>
                                                <span className="font-medium text-orange-600 dark:text-orange-400">+₹{cost.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-2" />

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">GST (18%)</span>
                                        <span className="text-slate-600 dark:text-slate-300">Included</span>
                                    </div>

                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 border border-orange-200 dark:border-orange-500/20 rounded-lg p-3 mt-2">
                                        <p className="text-[10px] text-orange-500/70 dark:text-orange-500/50 uppercase tracking-wider font-semibold">Estimated Total</p>
                                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-0.5">₹{estimatedCost.toLocaleString('en-IN')}</p>
                                    </div>

                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center pt-1">Final amount may vary after review</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!form.name || !form.email || !form.phone || !form.numGuards || !form.durationValue}
                            className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm shadow-orange-500/20"
                        >
                            Review <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <div className="space-y-5">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review & Confirm</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please review your booking before submitting.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        {/* Service header with gradient */}
                        <div className="px-5 py-5 bg-gradient-to-r from-orange-50 via-orange-50 to-amber-50 dark:from-orange-500/5 dark:via-orange-500/5 dark:to-amber-500/5 border-b border-orange-200 dark:border-orange-500/15 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/20">
                                {serviceIcons[form.service] && React.createElement(serviceIcons[form.service], { className: 'w-5 h-5 text-white' })}
                            </div>
                            <div>
                                <span className="font-bold text-slate-900 dark:text-white text-base">{form.service}</span>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{serviceDescriptions[form.service]}</p>
                            </div>
                        </div>

                        <div className="p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-3">Booking Summary</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                {[
                                    { l: 'Name', v: form.name, icon: User },
                                    { l: 'Email', v: form.email, icon: Mail },
                                    { l: 'Phone', v: form.phone, icon: PhoneIcon },
                                    { l: 'Guards', v: `${form.numGuards} guard${form.numGuards > 1 ? 's' : ''}`, icon: Users },
                                    { l: 'Duration', v: `${form.durationValue} ${form.durationType}`, icon: Timer },
                                ].map(({ l, v, icon: FieldIcon }) => (
                                    <div key={l} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                        <FieldIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-0.5">{l}</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-200">{v}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedAddOns.length > 0 && (
                            <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800 pt-4">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2.5">Add-ons Selected</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAddOns.map(({ key, label, icon: Icon, cost }) => (
                                        <span key={key} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                                            <Icon className="w-3 h-3" /> {label}
                                            <span className="text-[10px] text-orange-400 dark:text-orange-500/60">+₹{cost.toLocaleString('en-IN')}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {form.message && (
                            <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800 pt-4">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Note</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 mt-1.5 italic">"{form.message}"</p>
                            </div>
                        )}

                        {/* Cost */}
                        <div className="px-5 py-5 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-orange-50/50 dark:from-slate-800/30 dark:to-orange-500/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Estimated Total</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-600">Incl. 18% GST</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">₹{estimatedCost.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-900 flex items-center gap-2">
                            <span className="text-red-400">⚠</span> {error}
                        </div>
                    )}

                    {/* Security assurance */}
                    <div className="flex items-center justify-center gap-4 py-2 text-[10px] text-slate-400 dark:text-slate-600">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Booking</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Data Encrypted</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 24hr Response</span>
                    </div>

                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-7 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold disabled:opacity-60 transition-all flex items-center gap-2 shadow-sm shadow-orange-500/25"
                        >
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><ShieldCheck className="w-4 h-4" /> Confirm Booking</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── My Profile Tab ──────────────────────────────────────────────
const MyProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ name: '', phone: '', company: '', address: '' });
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, queriesRes] = await Promise.all([apiFetch('/api/customer/profile'), apiFetch('/api/customer/queries')]);
                if (profileRes.ok) { const d = await profileRes.json(); setProfile({ name: d.name || '', phone: d.phone || '', company: d.company || '', address: d.address || '' }); }
                if (queriesRes.ok) { const d = await queriesRes.json(); setQueries(d || []); }
            } catch (err) { console.error('Failed to load profile data', err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault(); setSaving(true); setMsg({ text: '', type: '' });
        try {
            const res = await apiFetch('/api/customer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
            if (res.ok) { setMsg({ text: 'Profile updated successfully!', type: 'success' }); setTimeout(() => setIsEditingProfile(false), 1500); }
            else { const d = await res.json(); setMsg({ text: d.error || 'Failed to update', type: 'error' }); }
        } catch { setMsg({ text: 'Network error.', type: 'error' }); } finally { setSaving(false); }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault(); setPasswordSaving(true); setPasswordMsg({ text: '', type: '' });
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordMsg({ text: 'New passwords do not match.', type: 'error' }); setPasswordSaving(false); return; }
        try {
            const res = await apiFetch('/api/customer/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }) });
            const d = await res.json();
            if (res.ok) { setPasswordMsg({ text: 'Password updated!', type: 'success' }); setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' }); }
            else { setPasswordMsg({ text: d.error || 'Failed to update password', type: 'error' }); }
        } catch { setPasswordMsg({ text: 'Network error.', type: 'error' }); } finally { setPasswordSaving(false); }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </div>
    );

    const activeServices = queries.filter(q => q.status === 'In Progress').length;
    const completedServices = queries.filter(q => q.status === 'Resolved').length;
    const totalSpent = queries.filter(q => q.status !== 'Rejected').reduce((s, q) => s + (Number(q.cost) || 0), 0);
    const recentBookings = queries.slice(0, 5);
    const initials = profile.name ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CU';

    const inputClass = "w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors";
    const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider";

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
            {/* Left Column */}
            <div className="space-y-4 xl:col-span-1">
                {/* Profile Card */}
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    {/* Gradient Banner */}
                    <div className="relative h-28 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 dark:from-orange-600 dark:via-orange-700 dark:to-amber-700">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-60" />
                        {/* Edit button on banner */}
                        {!isEditingProfile && (
                            <button
                                onClick={() => setIsEditingProfile(true)}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all group"
                                title="Edit Profile"
                            >
                                <Pencil className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>

                    {/* Avatar overlapping banner */}
                    <div className="relative px-5 -mt-10">
                        <div className="flex items-end gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-orange-600 dark:text-orange-400 text-2xl font-bold flex-shrink-0">
                                <div className="w-full h-full rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                    {initials}
                                </div>
                            </div>
                            <div className="pb-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{profile.name || 'Customer'}</h3>
                                    <BadgeCheck className="w-4.5 h-4.5 text-orange-500 flex-shrink-0" />
                                </div>
                                {profile.company && (
                                    <p className="text-xs font-medium text-orange-600 dark:text-orange-500 flex items-center gap-1 mt-0.5">
                                        <Building2 className="w-3 h-3" /> {profile.company}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <CardContent className="px-5 pt-4 pb-5">
                        {msg.text && (
                            <div className={`p-3 rounded-lg text-sm mb-4 flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'}`}>
                                {msg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : null}
                                {msg.text}
                            </div>
                        )}

                        {!isEditingProfile ? (
                            <div className="space-y-1">
                                {/* Detail rows with icons */}
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {[
                                        { icon: User, label: 'Full Name', value: profile.name },
                                        { icon: Mail, label: 'Email', value: user?.email },
                                        { icon: PhoneIcon, label: 'Phone', value: profile.phone },
                                        { icon: Building2, label: 'Company', value: profile.company },
                                        { icon: MapPin, label: 'Address', value: profile.address },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="flex items-center gap-3 py-3 group">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                                                <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">{label}</p>
                                                <p className="text-sm text-slate-900 dark:text-slate-200 truncate mt-0.5">
                                                    {value || <span className="text-slate-300 dark:text-slate-700 italic">Not provided</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Member since badge */}
                                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Member since</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto">
                                            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-3.5">
                                    {[
                                        { field: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Enter your full name' },
                                        { field: 'phone', label: 'Phone', type: 'tel', icon: PhoneIcon, placeholder: '+91 XXXXX XXXXX' },
                                        { field: 'company', label: 'Company', type: 'text', icon: Building2, placeholder: 'Company or organization' },
                                    ].map(({ field, label, type, icon: Icon, placeholder }) => (
                                        <div key={field} className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                <Icon className="w-3 h-3" /> {label}
                                            </label>
                                            <input type={type} value={profile[field]} placeholder={placeholder} onChange={(e) => setProfile(p => ({ ...p, [field]: e.target.value }))} className={inputClass} />
                                        </div>
                                    ))}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <MapPin className="w-3 h-3" /> Address
                                        </label>
                                        <textarea value={profile.address} placeholder="Your address" onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20">
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Save Changes
                                    </button>
                                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Security</h3>
                    </div>
                    <CardContent className="p-5">
                        {!isChangingPassword ? (
                            <button onClick={() => setIsChangingPassword(true)} className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                                Change Password
                            </button>
                        ) : (
                            <form onSubmit={handleSavePassword} className="space-y-3">
                                {[
                                    { field: 'oldPassword', label: 'Current Password' },
                                    { field: 'newPassword', label: 'New Password', minLength: 8 },
                                    { field: 'confirmPassword', label: 'Confirm New Password' },
                                ].map(({ field, label, minLength }) => (
                                    <div key={field} className="space-y-1">
                                        <label className={labelClass}>{label}</label>
                                        <input type="password" value={passwordData[field]} onChange={(e) => setPasswordData(p => ({ ...p, [field]: e.target.value }))} minLength={minLength} required className={inputClass} />
                                    </div>
                                ))}
                                {passwordMsg.text && (
                                    <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'}`}>
                                        {passwordMsg.text}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button type="submit" disabled={passwordSaving} className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                                        {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                                    </button>
                                    <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6 xl:col-span-2">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Active Services', value: activeServices, icon: Activity, colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500' },
                        { label: 'Completed', value: completedServices, icon: CheckCircle, colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500' },
                        { label: 'Total Spend', value: `₹${totalSpent > 999 ? (totalSpent/1000).toFixed(1)+'k' : totalSpent}`, icon: TrendingUp, colorClass: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500' },
                    ].map(({ label, value, icon: Icon, colorClass }) => (
                        <Card key={label} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-visible">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={`p-4 rounded-xl ${colorClass}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Bookings */}
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-200">Recent Bookings</h3>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-600">{recentBookings.length} entries</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentBookings.length > 0 ? recentBookings.map((booking) => {
                            const cfg = statusConfig[booking.status] || statusConfig.Pending;
                            const Icon = serviceIcons[booking.service] || Shield;
                            return (
                                <div key={booking.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-slate-900 dark:text-slate-200 text-sm truncate">{booking.service}</p>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                                    <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
                                                {new Date(booking.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {' · '}{booking.num_guards || 1} guard{(booking.num_guards || 1) > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-slate-200 text-sm flex-shrink-0">
                                        ₹{(Number(booking.cost) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center">
                                <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                                <p className="text-slate-500 dark:text-slate-400 text-sm">No bookings yet.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────
const CustomerDashboard = () => {
    const [activeSection, setActiveSection] = useState('bookings');

    const navItems = [
        { id: 'bookings', label: 'My Bookings', icon: ClipboardList, desc: 'View & track all your service requests' },
        { id: 'new-booking', label: 'New Booking', icon: PlusCircle, desc: 'Request a new security service' },
        { id: 'profile', label: 'My Profile', icon: User, desc: 'Manage account & preferences' },
    ];

    const handleBookingSuccess = useCallback(() => setActiveSection('bookings'), []);

    const renderContent = () => {
        switch (activeSection) {
            case 'new-booking': return <NewBooking onSubmitSuccess={handleBookingSuccess} />;
            case 'profile': return <MyProfile />;
            default: return <MyBookings />;
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customer Portal</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Security Services</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeSection === item.id
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="md:hidden w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 absolute z-10">
                <select
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                >
                    {navItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
            </div>

            <main className="flex-1 min-w-0 overflow-y-auto pt-20 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="mb-8 hidden md:block">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {navItems.find(i => i.id === activeSection)?.label}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {navItems.find(i => i.id === activeSection)?.desc}
                        </p>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboard;
