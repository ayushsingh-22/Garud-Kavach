import React, { useEffect, useRef, useState, useCallback } from 'react';
import apiFetch from '../../utils/apiFetch';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card';
import { Badge } from '../../Components/ui/badge';
import { Button } from '../../Components/ui/button';
import {
  MapPin, Wifi, WifiOff, AlertTriangle, Clock, RefreshCw,
  Shield, Copy, CheckCheck, ChevronDown, ChevronUp, Bell, CheckCircle, X,
  Phone, Mail, MapPinned, CreditCard, IndianRupee, Eye, ExternalLink, User
} from 'lucide-react';

// Derive WS URL from the current page origin so it works from any device
// (localhost in dev, LAN IP on mobile, production domain in prod).
// VITE_API_URL is only set in production builds.
const API_URL = import.meta.env.VITE_API_URL || '';
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
      className={`group border rounded-xl transition-all cursor-pointer hover:shadow-md ${
        guard.severity === 'sos'
          ? 'border-red-300 bg-gradient-to-r from-red-50 to-white dark:from-red-950/30 dark:to-slate-900 shadow-sm shadow-red-200/50 dark:shadow-red-900/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
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

        {/* Name + time */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{guard.guardName || `Guard #${guard.guardId}`}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTS(guard.timestamp)}
          </p>
        </div>

        {/* Badge */}
        <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${meta.cls}`}>
          {meta.label}
        </span>

        {/* Location */}
        {(guard.lat || guard.lng) && (
          <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3" />
            {formatCoord(guard.lat)}, {formatCoord(guard.lng)}
          </span>
        )}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuardTracking() {
  const [guards, setGuards] = useState({}); // guardId → OutgoingMsg
  const [wsState, setWsState] = useState('connecting'); // connecting | open | closed
  const [tokenTarget, setTokenTarget] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [incidents, setIncidents] = useState([]);
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

    ws.onclose = () => {
      if (wsRef.current !== ws) return; // superseded
      setWsState('closed');
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
      .then(d => setIncidents(Array.isArray(d) ? d.slice(0, 10) : []))
      .catch(() => {});
  }, []);

  const [bannerAcking, setBannerAcking] = useState(false);

  const guardList = Object.values(guards);
  const onDuty = guardList.filter(g => g.clockedIn).length;
  const sosGuards = guardList.filter(g => g.severity === 'sos');
  const sosCount = sosGuards.length;

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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30">
          <Bell className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {sosCount === 1 ? '1 SOS ALERT ACTIVE' : `${sosCount} SOS ALERTS ACTIVE`}
            </p>
            <p className="text-xs text-red-100 mt-0.5">
              {sosGuards.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')}
            </p>
          </div>
          {sosCount === 1 ? (
            <button
              onClick={() => handleBannerAck(sosGuards[0].guardId)}
              disabled={bannerAcking}
              className="text-xs bg-white text-red-600 hover:bg-red-50 font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
            >
              {bannerAcking ? '…' : '✓ Acknowledge'}
            </button>
          ) : (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">Expand a guard to acknowledge</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Guard Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time WebSocket updates from field guards</p>
        </div>
        <div className="flex items-center gap-3">
          {wsState === 'open' ? (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              Connected
            </span>
          ) : wsState === 'connecting' ? (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              <WifiOff className="w-3.5 h-3.5" /> Disconnected
            </span>
          )}
          <button
            onClick={connect}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
              wsState === 'closed'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : wsState === 'connecting'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-wait'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${wsState === 'connecting' ? 'animate-spin' : ''}`} />
            {wsState === 'closed' ? 'Reconnect Now' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Connected Guards</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{guardList.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">On Duty</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{onDuty}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${sosCount > 0 ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${sosCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active SOS</p>
              <p className={`text-2xl font-bold ${sosCount > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{sosCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guard list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Guard Status</h3>
          {guardList.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <WifiOff className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No guards connected yet.</p>
                <p className="text-xs text-slate-400 mt-1">Guards connect via the Guard PWA using their unique token.</p>
              </CardContent>
            </Card>
          ) : (
            // SOS guards first, then clocked-in, then offline
            [...guardList]
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
          )}
        </div>

        {/* Incident feed */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Recent Incidents</h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {incidents.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-400">No incidents reported.</p>
                </div>
              ) : incidents.map(inc => (
                <div key={inc.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{inc.title}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${
                        inc.severity === 'sos'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : inc.severity === 'high'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {inc.severity}
                    </Badge>
                  </div>
                  {inc.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
                  )}
                  {/* Phase-2: Display incident report photo when available */}
                  {inc.photoUrl && (
                    <a href={inc.photoUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img
                        src={inc.photoUrl}
                        alt="Incident"
                        className="w-full max-h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{new Date(inc.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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

      {/* Token modal */}
      {tokenTarget && <TokenModal guard={tokenTarget} onClose={() => setTokenTarget(null)} />}
    </div>
  );
}
