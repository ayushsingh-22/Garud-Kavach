import React, { useEffect, useRef, useState, useCallback } from 'react';
import apiFetch from '../../utils/apiFetch';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card';
import { Badge } from '../../Components/ui/badge';
import { Button } from '../../Components/ui/button';
import {
  MapPin, Wifi, WifiOff, AlertTriangle, Clock, RefreshCw,
  Shield, Copy, CheckCheck, ChevronDown, ChevronUp, Bell, CheckCircle, X
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

// ─── Guard Row ────────────────────────────────────────────────────────────────

const GuardRow = ({ guard, onShowToken, onAcknowledge }) => {
  const [expanded, setExpanded] = useState(false);
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
    <div className={`border rounded-xl transition-all ${
      guard.severity === 'sos'
        ? 'border-red-400 bg-red-50 dark:bg-red-950/20 shadow-red-200 shadow-sm'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
    }`}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          guard.severity === 'sos'
            ? 'bg-red-600 text-white'
            : guard.clockedIn
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
        }`}>
          {guard.guardName ? guard.guardName.charAt(0).toUpperCase() : <Shield className="w-4 h-4" />}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{guard.guardName || `Guard #${guard.guardId}`}</p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTS(guard.timestamp)}
          </p>
        </div>

        {/* Badge */}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${meta.cls}`}>
          {meta.label}
        </span>

        {/* Location indicator */}
        {(guard.lat || guard.lng) && (
          <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3" />
            {formatCoord(guard.lat)}, {formatCoord(guard.lng)}
          </span>
        )}

        {/* Expand */}
        <button className="text-slate-400 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 flex-1">
            <p><span className="font-medium">Guard ID:</span> {guard.guardId}</p>
            <p><span className="font-medium">Latitude:</span> {formatCoord(guard.lat)}</p>
            <p><span className="font-medium">Longitude:</span> {formatCoord(guard.lng)}</p>
            <p><span className="font-medium">Last Update:</span> {guard.timestamp ? new Date(guard.timestamp).toLocaleString() : '—'}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onShowToken(guard)}
          >
            <Copy className="w-3 h-3 mr-1" /> View Token
          </Button>
          {guard.severity === 'sos' && (
            <Button
              size="sm"
              onClick={handleAck}
              disabled={acking}
              className="text-xs bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <CheckCircle className="w-3 h-3 mr-1" /> {acking ? 'Clearing…' : 'Acknowledge SOS'}
            </Button>
          )}
          {guard.lat && guard.lng && (
            <a
              href={`https://www.google.com/maps?q=${guard.lat},${guard.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" /> Open in Maps
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuardTracking() {
  const [guards, setGuards] = useState({}); // guardId → OutgoingMsg
  const [wsState, setWsState] = useState('connecting'); // connecting | open | closed
  const [tokenTarget, setTokenTarget] = useState(null);
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
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Wifi className="w-4 h-4" /> Connected
            </span>
          ) : wsState === 'connecting' ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" /> Connecting…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
              <WifiOff className="w-4 h-4" /> Disconnected — retrying in 5s
            </span>
          )}
          <Button size="sm" variant="outline" onClick={connect} className="text-xs">
            <RefreshCw className="w-3 h-3 mr-1.5" /> Reconnect
          </Button>
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
              <p className="text-xs text-slate-500">Connected Guards</p>
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
              <p className="text-xs text-slate-500">On Duty</p>
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
              <p className="text-xs text-slate-500">Active SOS</p>
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
                <GuardRow key={g.guardId} guard={g} onShowToken={setTokenTarget} onAcknowledge={handleAcknowledge} />
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
                            : 'bg-slate-100 text-slate-600'
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

      {/* Token modal */}
      {tokenTarget && <TokenModal guard={tokenTarget} onClose={() => setTokenTarget(null)} />}
    </div>
  );
}
