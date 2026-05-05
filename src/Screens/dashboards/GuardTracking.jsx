import React, { useEffect, useRef, useState, useCallback } from 'react';
import apiFetch from '../../utils/apiFetch';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card';
import { Badge } from '../../Components/ui/badge';
import { Button } from '../../Components/ui/button';
import {
  MapPin, Wifi, WifiOff, AlertTriangle, Clock, RefreshCw,
  Shield, Copy, CheckCheck, ChevronDown, ChevronUp, Bell, CheckCircle, X,
  Phone, Mail, MapPinned, CreditCard, IndianRupee, Eye, ExternalLink, User,
  Search, Activity, Radio, Camera, ImageOff, SlidersHorizontal
} from 'lucide-react';

// Derive WS URL from the current page origin so it works from any device
// (localhost in dev, LAN IP on mobile, production domain in prod).
// VITE_API_URL is only set in production builds.
const API_URL = import.meta.env.VITE_API_URL || '';
// In dev, route WS through the Vite proxy (same host as the page).
// Works from localhost, any LAN IP, and any port without hardcoding.
const WS_URL = API_URL
  ? API_URL.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusMeta = (guard) => {
  if (guard.severity === 'sos') return { label: 'SOS!', cls: 'bg-red-600 text-white animate-pulse' };
  if (guard.clockedIn) return { label: 'On Duty', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  return { label: 'Off Duty', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
};

const formatTS = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatCoord = (v) => (typeof v === 'number' ? v.toFixed(5) : '—');

// ─── Guard Token Modal ────────────────────────────────────────────────────────

const TokenModal = ({ guard, onClose }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch(`/api/guards/${guard.guardId}/token`)
      .then(r => r.json())
      .then(d => { setToken(d.guardToken); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guard.guardId]);

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const pwaUrl = `${window.location.origin.replace('3000', '5174')}?token=${token}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Guard Token</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Share this token with <span className="font-medium text-slate-700 dark:text-slate-300">{guard.guardName}</span> to connect the Guard PWA.
        </p>
        {loading ? (
          <div className="h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
        ) : token ? (
          <>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{token}</code>
              <button onClick={copy} className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400 break-all">PWA URL: <span className="text-blue-500">{pwaUrl}</span></p>
          </>
        ) : (
          <p className="text-sm text-red-500">Failed to load token.</p>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Guard Detail Modal ───────────────────────────────────────────────────────

const GuardDetailModal = ({ guard, onClose, onShowToken, onAcknowledge }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState(false);
  const meta = statusMeta(guard);

  useEffect(() => {
    apiFetch(`/api/guards/${guard.guardId}`)
      .then(r => r.json())
      .then(d => { setDetails(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guard.guardId]);

  const handleAck = async () => {
    setAcking(true);
    try {
      await apiFetch(`/api/guards/${guard.guardId}/sos/clear`, { method: 'POST' });
      onAcknowledge?.(guard.guardId);
    } catch (_) {}
    finally { setAcking(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200 dark:border-slate-700/50"
        onClick={e => e.stopPropagation()}
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Header */}
        <div className={`relative px-6 pt-6 pb-4 ${
          guard.severity === 'sos'
            ? 'bg-gradient-to-br from-red-600 to-red-700'
            : guard.clockedIn
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
              : 'bg-gradient-to-br from-slate-700 to-slate-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            {details?.photo_url ? (
              <img
                src={details.photo_url}
                alt={guard.guardName}
                className="w-20 h-20 rounded-full object-cover border-3 border-white/40 shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="w-20 h-20 rounded-full bg-white/20 items-center justify-center text-2xl font-bold text-white border-3 border-white/40 shadow-lg"
              style={{ display: details?.photo_url ? 'none' : 'flex' }}
            >
              {guard.guardName ? guard.guardName.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{guard.guardName || `Guard #${guard.guardId}`}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  guard.severity === 'sos'
                    ? 'bg-white text-red-600'
                    : guard.clockedIn
                      ? 'bg-white/20 text-white'
                      : 'bg-white/20 text-white'
                }`}>
                  {meta.label}
                </span>
                <span className="text-xs text-white/70">ID: {guard.guardId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live Tracking Info */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Live Tracking</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <MapPinned className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Latitude</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{formatCoord(guard.lat)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <MapPinned className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Longitude</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{formatCoord(guard.lng)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Last Update</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{guard.timestamp ? new Date(guard.timestamp).toLocaleString() : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Duty Status</p>
                      <p className={`text-sm font-semibold ${guard.clockedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{guard.clockedIn ? 'On Duty' : 'Off Duty'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guard Details from API */}
              {details && !details.error && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Personal Details</h4>
                  <div className="space-y-2">
                    {details.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Phone</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{details.phone}</p>
                        </div>
                      </div>
                    )}
                    {details.email && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{details.email}</p>
                        </div>
                      </div>
                    )}
                    {details.address && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Address</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{details.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {details.license_no && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                          <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">License</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{details.license_no}</p>
                          </div>
                        </div>
                      )}
                      {details.license_expiry && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Expiry</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{new Date(details.license_expiry).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <IndianRupee className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Hourly Rate</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">₹{details.hourly_rate ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Status</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{details.status || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-2">
          {guard.severity === 'sos' && (
            <Button
              size="sm"
              onClick={handleAck}
              disabled={acking}
              className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg text-xs font-medium px-4"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {acking ? 'Clearing…' : 'Acknowledge SOS'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs font-medium px-4 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => onShowToken(guard)}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> View Token
          </Button>
          {guard.lat && guard.lng && (
            <a
              href={`https://www.google.com/maps?q=${guard.lat},${guard.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs font-medium px-4 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in Maps
              </Button>
            </a>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="rounded-lg text-xs font-medium px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Guard Card ───────────────────────────────────────────────────────────────

const GuardRow = ({ guard, onShowToken, onAcknowledge, onSelect }) => {
  const [acking, setAcking] = useState(false);
  const meta = statusMeta(guard);

  const handleAck = async (e) => {
    e.stopPropagation();
    setAcking(true);
    try {
      await apiFetch(`/api/guards/${guard.guardId}/sos/clear`, { method: 'POST' });
      onAcknowledge?.(guard.guardId);
    } catch (_) {}
    finally { setAcking(false); }
  };

  return (
    <div
      className={`group border-l-[3px] border rounded-xl transition-all cursor-pointer hover:shadow-md ${
        guard.severity === 'sos'
          ? 'border-l-red-500 border-red-200 bg-gradient-to-r from-red-50/80 to-white dark:from-red-950/30 dark:to-slate-900 shadow-sm shadow-red-200/50 dark:shadow-red-900/20'
          : guard.clockedIn
            ? 'border-l-emerald-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            : 'border-l-slate-300 dark:border-l-slate-600 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      onClick={() => onSelect(guard)}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-offset-2 dark:ring-offset-slate-900 ${
          guard.severity === 'sos'
            ? 'bg-red-600 text-white ring-red-300'
            : guard.clockedIn
              ? 'bg-emerald-500 text-white ring-emerald-300 dark:ring-emerald-700'
              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 ring-slate-200 dark:ring-slate-600'
        }`}>
          {guard.guardName ? guard.guardName.charAt(0).toUpperCase() : <Shield className="w-4 h-4" />}
        </div>

        {/* Name + time + location */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{guard.guardName || `Guard #${guard.guardId}`}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTS(guard.timestamp)}
            </p>
            {(guard.lat || guard.lng) && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <MapPin className="w-2.5 h-2.5" />{formatCoord(guard.lat)}, {formatCoord(guard.lng)}
              </span>
            )}
          </div>
        </div>

        {/* Badge */}
        <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${meta.cls}`}>
          {meta.label}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {guard.severity === 'sos' && (
            <button
              onClick={handleAck}
              disabled={acking}
              className="flex items-center gap-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <CheckCircle className="w-3 h-3" /> {acking ? '…' : 'ACK'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onShowToken(guard); }}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Copy className="w-3 h-3" /> Token
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(guard); }}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" /> View
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Incident Detail Modal ────────────────────────────────────────────────────

const severityConfig = {
  sos:    { label: 'SOS',    gradient: 'from-red-600 to-red-700',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    icon: '🔴' },
  high:   { label: 'High',   gradient: 'from-orange-500 to-orange-600', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🟠' },
  medium: { label: 'Medium', gradient: 'from-amber-500 to-yellow-600',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: '🟡' },
  low:    { label: 'Low',    gradient: 'from-emerald-500 to-teal-600',  badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: '🟢' },
};

const IncidentDetailModal = ({ incident, onClose }) => {
  const cfg = severityConfig[incident.severity] || severityConfig.low;
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200 dark:border-slate-700/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative px-6 pt-6 pb-4 bg-gradient-to-br ${cfg.gradient}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
              {cfg.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-white leading-tight">{incident.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/20 text-white uppercase">
                  {cfg.label}
                </span>
                <span className="text-xs text-white/70">#{incident.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
          {/* Description */}
          {incident.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Description</h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
              </div>
            </div>
          )}

          {/* Photo */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Photo Evidence</h4>
            {incident.photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 min-h-[60px]">
                {photoLoading && !photoError && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                )}
                {photoError ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <ImageOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-400">Could not load photo</p>
                    <a href={incident.photoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline">
                      Open direct URL
                    </a>
                  </div>
                ) : (
                  <a href={incident.photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={incident.photoUrl}
                      alt="Incident Evidence"
                      onLoad={() => setPhotoLoading(false)}
                      onError={() => { setPhotoLoading(false); setPhotoError(true); }}
                      className={`w-full max-h-72 object-cover cursor-zoom-in transition-opacity ${photoLoading ? 'opacity-0' : 'opacity-100'}`}
                    />
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700">
                <ImageOff className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                <p className="text-xs text-slate-400">No photo attached to this incident</p>
              </div>
            )}
            {incident.photoUrl && !photoError && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Click photo to open full size
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Details</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Reported By */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <User className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Reported By</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {incident.guardName || (incident.guardId ? `Guard #${incident.guardId}` : 'Unknown')}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Reported At</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Location */}
              {(incident.lat || incident.lng) && (
                <>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <MapPinned className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Latitude</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{formatCoord(incident.lat)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <MapPinned className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Longitude</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{formatCoord(incident.lng)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-2">
          {(incident.lat && incident.lng) && (
            <a
              href={`https://www.google.com/maps?q=${incident.lat},${incident.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs font-medium px-4 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in Maps
              </Button>
            </a>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="rounded-lg text-xs font-medium px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Incident Card ───────────────────────────────────────────────────────────

const IncidentCard = ({ incident, onClick }) => {
  const cfg = severityConfig[incident.severity] || severityConfig.low;
  const hasPhoto = Boolean(incident.photoUrl);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden flex flex-col"
    >
      {/* Severity accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.icon}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          {hasPhoto && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20">
              <Camera className="w-2.5 h-2.5" /> Photo
            </span>
          )}
        </div>
        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
          {incident.title}
        </h4>
        {/* Description */}
        <div className="flex-1">
          {incident.description ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {incident.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400/60 italic">No description provided</p>
          )}
        </div>
        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {incident.guardName || (incident.guardId ? `Guard #${incident.guardId}` : 'Unknown')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{new Date(incident.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
      {/* Hover CTA */}
      <div className="px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full text-center text-xs font-semibold py-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
          View Full Details →
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuardTracking() {
  const [guards, setGuards] = useState({}); // guardId → OutgoingMsg
  const [wsState, setWsState] = useState('connecting'); // connecting | open | closed
  const [tokenTarget, setTokenTarget] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('all');
  const [incidentPage, setIncidentPage] = useState(1);
  const [acknowledgedSOS, setAcknowledgedSOS] = useState(new Set());
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const handleAcknowledge = useCallback((guardId) => {
    // Optimistically clear SOS locally; backend broadcast will confirm
    setGuards(prev => {
      if (!prev[guardId]) return prev;
      return { ...prev, [guardId]: { ...prev[guardId], severity: '' } };
    });
    setAcknowledgedSOS(prev => new Set([...prev, guardId]));
  }, []);

  // Safely dispose a WebSocket without triggering the browser's
  // "closed before connection established" warning.
  // If the socket is still CONNECTING, we can't call .close() — the browser
  // logs that warning regardless of JS handlers. Instead we let it open and
  // immediately close it from OPEN state, which is silent.
  const disposeWs = useCallback((ws) => {
    if (!ws) return;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.onopen = () => ws.close(); // silently close once open
    } else {
      ws.onopen = null;
      ws.close();
    }
  }, []);

  const connect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    disposeWs(wsRef.current);
    wsRef.current = null;

    setWsState('connecting');
    const ws = new WebSocket(`${WS_URL}/ws/admin`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current !== ws) { ws.close(); return; } // superseded
      setWsState('open');
    };

    ws.onmessage = (e) => {
      if (wsRef.current !== ws) return; // superseded
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'guard_list') {
          // Initial snapshot
          const map = {};
          (msg.guards || []).forEach(g => { map[g.guardId] = g; });
          setGuards(map);
        } else if (msg.type === 'guard_update') {
          setGuards(prev => ({ ...prev, [msg.guardId]: msg }));
        } else if (msg.type === 'guard_disconnect') {
          setGuards(prev => {
            const next = { ...prev };
            if (next[msg.guardId]) {
              next[msg.guardId] = { ...next[msg.guardId], clockedIn: false, severity: '' };
            }
            return next;
          });
        }
      } catch (_) { /* ignore parse errors */ }
    };

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return; // superseded
      setWsState('closed');
      // 4001 = auth failure, 4003 = forbidden — don't retry, session likely expired
      if (e.code === 4001 || e.code === 4003) return;
      reconnectTimer.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => ws.close();
  }, [disposeWs]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      disposeWs(wsRef.current);
      wsRef.current = null;
    };
  }, [connect, disposeWs]);

  // Fetch recent incidents once on mount
  useEffect(() => {
    apiFetch('/api/incidents')
      .then(r => r.json())
      .then(d => setIncidents(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const [bannerAcking, setBannerAcking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const guardList = Object.values(guards);
  const onDuty = guardList.filter(g => g.clockedIn).length;
  const sosGuards = guardList.filter(g => g.severity === 'sos');
  const sosCount = sosGuards.length;

  // Today's incidents count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const incidentsToday = incidents.filter(i => new Date(i.createdAt) >= todayStart).length;

  // Filtered incidents by severity
  const filteredIncidents = incidentSeverityFilter === 'all'
    ? incidents
    : incidents.filter(i => i.severity === incidentSeverityFilter);

  const INCIDENTS_PER_PAGE = 9;
  const totalIncidentPages = Math.max(1, Math.ceil(filteredIncidents.length / INCIDENTS_PER_PAGE));
  // Clamp current page if filter change shrinks available pages
  const clampedPage = Math.min(incidentPage, totalIncidentPages);
  const paginatedIncidents = filteredIncidents.slice(
    (clampedPage - 1) * INCIDENTS_PER_PAGE,
    clampedPage * INCIDENTS_PER_PAGE
  );

  // Filtered guard list based on search
  const filteredGuardList = searchQuery.trim()
    ? guardList.filter(g => (g.guardName || `Guard #${g.guardId}`).toLowerCase().includes(searchQuery.toLowerCase()))
    : guardList;

  const handleBannerAck = async (guardId) => {
    setBannerAcking(true);
    try {
      await apiFetch(`/api/guards/${guardId}/sos/clear`, { method: 'POST' });
      handleAcknowledge(guardId);
    } catch (_) {}
    finally { setBannerAcking(false); }
  };

  return (
    <div className="space-y-6">
      {/* SOS Alert Banner */}
      {sosCount > 0 && (
        <div className="relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 overflow-hidden">
          {/* Animated background pulse */}
          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
          <div className="relative flex items-center gap-4 flex-1">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Bell className="w-5 h-5 shrink-0 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-wide uppercase">
                {sosCount === 1 ? '⚠ 1 SOS Alert Active' : `⚠ ${sosCount} SOS Alerts Active`}
              </p>
              <p className="text-xs text-red-100 mt-0.5 truncate">
                {sosGuards.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')}
              </p>
            </div>
            {sosCount === 1 ? (
              <button
                onClick={() => handleBannerAck(sosGuards[0].guardId)}
                disabled={bannerAcking}
                className="relative text-xs bg-white text-red-600 hover:bg-red-50 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 shadow-md"
              >
                {bannerAcking ? '…' : 'Respond Now'}
              </button>
            ) : (
              <span className="relative text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-semibold">Click guard to respond</span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Live Guard Tracking</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time WebSocket updates from field guards</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {wsState === 'open' ? (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                System Online
              </span>
            ) : wsState === 'connecting' ? (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin" /> Connecting…
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
            <button
              onClick={connect}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
                wsState === 'closed'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : wsState === 'connecting'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-wait'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${wsState === 'connecting' ? 'animate-spin' : ''}`} />
              {wsState === 'closed' ? 'Reconnect' : 'Refresh'}
            </button>
          </div>
        </div>
        {/* Stats summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guards Online</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">{guardList.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">On Duty</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                {onDuty} <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{guardList.length > 0 ? `(${Math.round((onDuty / guardList.length) * 100)}%)` : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sosCount > 0 ? 'bg-red-100 dark:bg-red-500/20 animate-pulse' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <AlertTriangle className={`w-4 h-4 ${sosCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active SOS</p>
              <p className={`text-lg font-bold tabular-nums leading-tight ${sosCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {sosCount} <span className="text-xs font-medium text-slate-400">{sosCount > 0 ? 'needs response' : 'all clear'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Incidents Today</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                {incidentsToday} <span className="text-xs font-medium text-slate-400">{incidents.length > 0 ? `/ ${incidents.length} total` : ''}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duty distribution bar */}
      {guardList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duty Distribution</p>
            <p className="text-xs text-slate-400">{guardList.length} total</p>
          </div>
          <div className="w-full rounded-full overflow-hidden flex" style={{ height: 7 }}>
            {sosCount > 0 && <div className="bg-red-500" style={{ width: `${(sosCount / guardList.length) * 100}%`, transition: 'width .3s ease' }} />}
            {onDuty - sosCount > 0 && <div className="bg-emerald-500" style={{ width: `${((onDuty - sosCount) / guardList.length) * 100}%`, transition: 'width .3s ease' }} />}
            {(guardList.length - onDuty) > 0 && <div className="bg-slate-200 dark:bg-slate-700" style={{ width: `${((guardList.length - onDuty) / guardList.length) * 100}%`, transition: 'width .3s ease' }} />}
          </div>
          <div className="flex items-center gap-5 mt-2.5">
            {sosCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {sosCount} SOS
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {onDuty - sosCount} On Duty
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" /> {guardList.length - onDuty} Off Duty
            </span>
          </div>
        </div>
      )}

      {/* ── Guard Status List (full width) ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Guard Status</h3>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{guardList.length}</span>
              {wsState === 'open' && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            {/* Status legend */}
            <div className="hidden sm:flex items-center gap-3 ml-1">
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> SOS</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> On Duty</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Off Duty</span>
            </div>
          </div>
          {guardList.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search guards…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 dark:focus:border-orange-500 w-52 transition-all"
              />
            </div>
          )}
        </div>
        {guardList.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No guards connected</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs mx-auto">Guards connect via the Guard PWA using their unique token. Share tokens from the Guards section.</p>
            </CardContent>
          </Card>
        ) : filteredGuardList.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">No guards match "<span className="font-medium">{searchQuery}</span>"</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {searchQuery.trim() && (
              <p className="text-xs text-slate-400 dark:text-slate-500">Showing {filteredGuardList.length} of {guardList.length} guards</p>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {[...filteredGuardList]
                .sort((a, b) => {
                  if (a.severity === 'sos') return -1;
                  if (b.severity === 'sos') return 1;
                  if (a.clockedIn && !b.clockedIn) return -1;
                  if (!a.clockedIn && b.clockedIn) return 1;
                  return 0;
                })
                .map(g => (
                  <GuardRow key={g.guardId} guard={g} onShowToken={setTokenTarget} onAcknowledge={handleAcknowledge} onSelect={setSelectedGuard} />
                ))
              }
            </div>
          </>
        )}
      </div>

      {/* ── Recent Incidents (full width card grid) ──────────────────────── */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Incidents</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {incidentsToday > 0
                  ? `${incidentsToday} reported today · ${incidents.length} total`
                  : `${incidents.length} total incident${incidents.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          {/* Severity filter tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
            {[
              { key: 'all',    label: `All (${incidents.length})` },
              { key: 'sos',    label: '🔴 SOS' },
              { key: 'high',   label: '🟠 High' },
              { key: 'medium', label: '🟡 Medium' },
              { key: 'low',    label: '🟢 Low' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => { setIncidentSeverityFilter(f.key); setIncidentPage(1); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  incidentSeverityFilter === f.key
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Incident cards grid */}
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All Clear</p>
            <p className="text-xs text-slate-400/70 dark:text-slate-500 mt-1">No incidents reported</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-400">No <span className="font-semibold capitalize">{incidentSeverityFilter}</span> incidents found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedIncidents.map(inc => (
                <IncidentCard key={inc.id} incident={inc} onClick={() => setSelectedIncident(inc)} />
              ))}
            </div>

            {/* Pagination controls */}
            {totalIncidentPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {(clampedPage - 1) * INCIDENTS_PER_PAGE + 1}–{Math.min(clampedPage * INCIDENTS_PER_PAGE, filteredIncidents.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredIncidents.length}</span>{' '}
                  incidents
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={clampedPage === 1}
                    onClick={() => setIncidentPage(p => Math.max(1, p - 1))}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalIncidentPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setIncidentPage(page)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                        page === clampedPage
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={clampedPage === totalIncidentPages}
                    onClick={() => setIncidentPage(p => Math.min(totalIncidentPages, p + 1))}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Guard detail modal */}
      {selectedGuard && (
        <GuardDetailModal
          guard={selectedGuard}
          onClose={() => setSelectedGuard(null)}
          onShowToken={(g) => { setSelectedGuard(null); setTokenTarget(g); }}
          onAcknowledge={handleAcknowledge}
        />
      )}

      {/* Incident detail modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}

      {/* Token modal */}
      {tokenTarget && <TokenModal guard={tokenTarget} onClose={() => setTokenTarget(null)} />}
    </div>
  );
}
