import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiFetch from '../../utils/apiFetch';
import { Badge } from '../../Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Wifi, WifiOff, AlertTriangle, Shield, MapPin, Bell, CheckCircle, RefreshCw, Clock, Radio } from 'lucide-react';

// ─── Fix leaflet default icon broken by webpack/vite ─────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom marker icons ──────────────────────────────────────────────────────
const makeIcon = (color, pulse = false) =>
  L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px">
      ${ pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:mapPulse 1.5s ease-in-out infinite"></div>` : '' }
      <div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
        <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='white'><path d='M12 1a5 5 0 1 0 0 10A5 5 0 0 0 12 1zm-7 19a7 7 0 0 1 14 0H5z'/></svg>
      </div>
    </div>
    <style>@keyframes mapPulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.9);opacity:0}}</style>`,
    iconSize:    [32, 32],
    iconAnchor:  [16, 16],
    popupAnchor: [0, -18],
  });

const sosIcon        = makeIcon('#ef4444', true);
const onDutyIcon     = makeIcon('#22c55e');
const offDutyIcon    = makeIcon('#94a3b8');
const outsideGeoIcon = makeIcon('#f59e0b'); // amber — on duty but outside geofence

// ─── WS config ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || '';
// In dev, route WS through the Vite proxy (same host as the page).
// Works from localhost, any LAN IP, and any port without hardcoding.
const WS_URL = API_URL
  ? API_URL.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

// ─── Helper: safely dispose a WebSocket without triggering spurious errors ────
const disposeWs = (ws) => {
  if (!ws) return;
  ws.onmessage = null;
  ws.onerror   = null;
  ws.onclose   = null;
  if (ws.readyState === WebSocket.CONNECTING) {
    ws.onopen = () => ws.close();
  } else {
    ws.onopen = null;
    ws.close();
  }
};

// ─── Fit-bounds component (re-centers map when guards change) ─────────────────
function AutoFitBounds({ guards }) {
  const map = useMap();
  const prevLen = useRef(0);
  useEffect(() => {
    const valid = guards.filter(g => g.lat && g.lng && (g.lat !== 0 || g.lng !== 0));
    if (valid.length === 0) return;
    if (valid.length !== prevLen.current) {
      prevLen.current = valid.length;
      const bounds = L.latLngBounds(valid.map(g => [g.lat, g.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [guards, map]);
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTS = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const guardIcon = (g) => {
  if (g.severity === 'sos') return sosIcon;
  // inGeofence === false means on duty but outside the geofence boundary
  if (g.clockedIn && g.inGeofence === false) return outsideGeoIcon;
  if (g.clockedIn) return onDutyIcon;
  return offDutyIcon;
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveMapDashboard() {
  const [guardsMap, setGuardsMap] = useState({}); // guardId → OutgoingMsg
  const [wsStatus, setWsStatus]   = useState('disconnected');
  const [ackingId, setAckingId]   = useState(null);
  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);

  const handleAcknowledge = useCallback(async (guardId) => {
    setAckingId(guardId);
    try {
      await apiFetch(`/api/guards/${guardId}/sos/clear`, { method: 'POST' });
      setGuardsMap(prev => {
        if (!prev[guardId]) return prev;
        return { ...prev, [guardId]: { ...prev[guardId], severity: '' } };
      });
    } catch (_) {}
    finally { setAckingId(null); }
  }, []);

  const connect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    disposeWs(wsRef.current);
    wsRef.current = null;
    setWsStatus('connecting');

    const ws = new WebSocket(`${WS_URL}/ws/admin`);

    ws.onopen = () => {
      if (wsRef.current !== ws) return;
      setWsStatus('connected');
    };

    ws.onmessage = (e) => {
      if (wsRef.current !== ws) return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'guard_list') {
          const m = {};
          (msg.guards || []).forEach(g => { m[g.guardId] = g; });
          setGuardsMap(m);
        } else if (msg.type === 'guard_update') {
          setGuardsMap(prev => ({ ...prev, [msg.guardId]: msg }));
        } else if (msg.type === 'guard_disconnect') {
          setGuardsMap(prev => {
            const next = { ...prev };
            if (next[msg.guardId]) {
              next[msg.guardId] = { ...next[msg.guardId], clockedIn: false, severity: '' };
            }
            return next;
          });
        } else if (msg.type === 'incident' && msg.severity === 'sos') {
          // Phase-3: Handle SOS incidents reported via REST to show on map
          setGuardsMap(prev => {
            const existing = prev[msg.guardId] || {};
            return { ...prev, [msg.guardId]: { ...existing, ...msg, type: 'guard_update', severity: 'sos' } };
          });
        }
      } catch (_) {}
    };

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return;
      setWsStatus('disconnected');
      // 4001 = auth failure, 4003 = forbidden — don't retry, session likely expired
      if (e.code === 4001 || e.code === 4003) return;
      reconnectTimer.current = setTimeout(() => connect(), 5000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    // Phase-3: REST fallback — load current guard states (incl. SOS) immediately
    apiFetch('/api/guards/live')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGuardsMap(prev => {
            // Only populate if WS hasn't already sent data
            if (Object.keys(prev).length > 0) return prev;
            const m = {};
            data.forEach(g => { m[g.guardId] = g; });
            return m;
          });
        }
      })
      .catch(() => {});

    return () => {
      clearTimeout(reconnectTimer.current);
      disposeWs(wsRef.current);
      wsRef.current = null;
    };
  }, [connect]);

  const guards        = Object.values(guardsMap);
  const sos           = guards.filter(g => g.severity === 'sos');
  const outsideGeo    = guards.filter(g => g.clockedIn && g.severity !== 'sos' && g.inGeofence === false);
  const onDuty        = guards.filter(g => g.clockedIn && g.severity !== 'sos' && g.inGeofence !== false);
  const off           = guards.filter(g => !g.clockedIn);

  // Default center: India
  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* ── SOS Alert Banner ── */}
      {sos.length > 0 && (
        <div className="relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
          <div className="relative flex items-center gap-4 flex-1">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Bell className="w-5 h-5 shrink-0 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-wide uppercase">
                {sos.length === 1 ? '⚠ 1 SOS Alert Active' : `⚠ ${sos.length} SOS Alerts Active`}
              </p>
              <p className="text-xs text-red-100 mt-0.5 truncate">
                {sos.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')}
              </p>
            </div>
            {sos.length === 1 ? (
              <Button
                size="sm"
                onClick={() => handleAcknowledge(sos[0].guardId)}
                disabled={ackingId === sos[0].guardId}
                className="relative shrink-0 bg-white text-red-600 hover:bg-red-50 border-0 text-xs font-bold px-4 py-2 rounded-lg shadow-md"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {ackingId === sos[0].guardId ? 'Clearing…' : 'Respond Now'}
              </Button>
            ) : (
              <span className="relative text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-semibold">Click guard to respond</span>
            )}
          </div>
        </div>
      )}

      {/* ── Header + Stats Card ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Live Guard Map</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time guard positions and status tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {wsStatus === 'connected' ? (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                <Wifi className="w-3.5 h-3.5" /> Live
              </span>
            ) : wsStatus === 'connecting' ? (
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
                wsStatus === 'disconnected'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : wsStatus === 'connecting'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-wait'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${wsStatus === 'connecting' ? 'animate-spin' : ''}`} />
              {wsStatus === 'disconnected' ? 'Reconnect' : 'Refresh'}
            </button>
          </div>
        </div>
        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
          <div className={`flex items-center gap-3 px-5 py-3.5 ${sos.length > 0 ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sos.length > 0 ? 'bg-red-100 dark:bg-red-500/20 animate-pulse' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <AlertTriangle className={`w-4 h-4 ${sos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-red-400 dark:text-red-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">SOS Active</p>
              <p className={`text-lg font-bold tabular-nums leading-tight ${sos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {sos.length} <span className="text-xs font-medium text-slate-400">{sos.length > 0 ? 'needs response' : 'all clear'}</span>
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-3 px-5 py-3.5 ${outsideGeo.length > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${outsideGeo.length > 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
              <MapPin className={`w-4 h-4 ${outsideGeo.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-amber-400 dark:text-amber-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Outside Geo</p>
              <p className={`text-lg font-bold tabular-nums leading-tight ${outsideGeo.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {outsideGeo.length} <span className="text-xs font-medium text-slate-400">{outsideGeo.length > 0 ? 'breach' : 'in bounds'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">On Duty</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                {onDuty.length} <span className="text-xs font-medium text-slate-400">{guards.length > 0 ? `(${Math.round((onDuty.length / guards.length) * 100)}%)` : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Off Duty</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums leading-tight">
                {off.length} <span className="text-xs font-medium text-slate-400">{guards.length > 0 ? `/ ${guards.length} total` : ''}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Geofence breach banner ── */}
      {outsideGeo.length > 0 && sos.length === 0 && (
        <div className="relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-400/30 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm tracking-wide">
              {outsideGeo.length === 1 ? '⚠ 1 Guard Outside Geofence' : `⚠ ${outsideGeo.length} Guards Outside Geofence`}
            </p>
            <p className="text-xs text-amber-100 mt-0.5 truncate">
              {outsideGeo.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')} — breached assigned perimeters
            </p>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 min-h-[420px]">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ width: '100%', height: '100%', minHeight: '420px' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoFitBounds guards={guards.filter(g => g.lat && g.lng)} />
          {guards
            .filter(g => g.lat && g.lng && (g.lat !== 0 || g.lng !== 0))
            .map(g => (
              <Marker key={g.guardId} position={[g.lat, g.lng]} icon={guardIcon(g)}>
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: g.severity === 'sos' ? '#ef4444' : g.clockedIn ? '#22c55e' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14,
                        border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}>
                        {(g.guardName || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: '#0f172a' }}>{g.guardName || `Guard #${g.guardId}`}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                          background: g.severity === 'sos' ? '#fef2f2' : (g.clockedIn && g.inGeofence === false) ? '#fffbeb' : g.clockedIn ? '#ecfdf5' : '#f1f5f9',
                          color: g.severity === 'sos' ? '#ef4444' : (g.clockedIn && g.inGeofence === false) ? '#f59e0b' : g.clockedIn ? '#22c55e' : '#94a3b8',
                        }}>
                          {g.severity === 'sos' ? '🚨 SOS ACTIVE' : (g.clockedIn && g.inGeofence === false) ? '⚠️ Outside Geofence' : g.clockedIn ? '✅ On Duty' : '⚫ Off Duty'}
                        </span>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>📍 {g.lat?.toFixed(5)}° N, {g.lng?.toFixed(5)}° E</p>
                      <p style={{ fontSize: 11, color: '#64748b' }}>🕐 Updated: {formatTS(g.timestamp)}</p>
                    </div>
                    {g.severity === 'sos' && (
                      <button
                        onClick={() => handleAcknowledge(g.guardId)}
                        disabled={ackingId === g.guardId}
                        style={{
                          marginTop: 4, width: '100%', padding: '8px 0',
                          background: ackingId === g.guardId ? '#fca5a5' : '#ef4444',
                          color: '#fff', border: 'none', borderRadius: 8,
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {ackingId === g.guardId ? 'Clearing\u2026' : '✓ Acknowledge SOS'}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* ── Guard list (SOS first) ── */}
      {guards.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Active Guards</CardTitle>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{guards.length}</span>
              </div>
              <div className="flex items-center gap-3">
                {sos.length > 0 && <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /> {sos.length} SOS</span>}
                {outsideGeo.length > 0 && <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> {outsideGeo.length} Breach</span>}
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {onDuty.length} On Duty</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-3">
            <div className="space-y-1.5">
              {[...sos, ...outsideGeo, ...onDuty, ...off].map(g => (
                <div key={g.guardId} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all border-l-[3px] cursor-default hover:shadow-sm ${
                  g.severity === 'sos'
                    ? 'border-l-red-500 bg-red-50/80 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : (g.clockedIn && g.inGeofence === false)
                      ? 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                      : g.clockedIn
                        ? 'border-l-emerald-500 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'border-l-slate-300 dark:border-l-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-70'
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-offset-1 dark:ring-offset-slate-900 ${
                    g.severity === 'sos'
                      ? 'bg-red-600 text-white ring-red-300'
                      : (g.clockedIn && g.inGeofence === false)
                        ? 'bg-amber-500 text-white ring-amber-300 dark:ring-amber-700'
                        : g.clockedIn
                          ? 'bg-emerald-500 text-white ring-emerald-300 dark:ring-emerald-700'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 ring-slate-200 dark:ring-slate-600'
                  }`}>
                    {(g.guardName || 'G').charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                      {g.guardName || `Guard #${g.guardId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {formatTS(g.timestamp)}
                      </span>
                      {g.lat && g.lng && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          <MapPin className="w-2.5 h-2.5" />{g.lat?.toFixed(4)}°, {g.lng?.toFixed(4)}°
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {g.severity === 'sos' ? (
                      <>
                        <Badge className="bg-red-600 text-white text-[10px] font-bold animate-pulse px-2 py-0.5 rounded-full">🚨 SOS</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(g.guardId)}
                          disabled={ackingId === g.guardId}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white border-0 h-7 px-3 rounded-lg shadow-sm shadow-red-500/30"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {ackingId === g.guardId ? '…' : 'Ack'}
                        </Button>
                      </>
                    ) : (g.clockedIn && g.inGeofence === false) ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-semibold rounded-full">⚠ Outside Geo</Badge>
                    ) : g.clockedIn ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-semibold rounded-full">● On Duty</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-semibold rounded-full">Off Duty</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
