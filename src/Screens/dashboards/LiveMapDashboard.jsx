import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiFetch from '../../utils/apiFetch';
import { Badge } from '../../Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Wifi, WifiOff, AlertTriangle, Shield, MapPin, Bell, CheckCircle, RefreshCw } from 'lucide-react';

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

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setWsStatus('disconnected');
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse">
          <Bell className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {sos.length === 1 ? '1 SOS ALERT ACTIVE' : `${sos.length} SOS ALERTS ACTIVE`}
            </p>
            <p className="text-xs text-red-100 truncate">
              {sos.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')}
            </p>
          </div>
          {sos.length === 1 && (
            <Button
              size="sm"
              onClick={() => handleAcknowledge(sos[0].guardId)}
              disabled={ackingId === sos[0].guardId}
              className="shrink-0 bg-white text-red-600 hover:bg-red-50 border-0 text-xs font-semibold"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              {ackingId === sos[0].guardId ? 'Clearing…' : 'Acknowledge'}
            </Button>
          )}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Guard Map</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time guard positions</p>
        </div>
        <div className="flex items-center gap-2">
          {wsStatus === 'connected'
            ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1"><Wifi className="w-3 h-3" /> Live</Badge>
            : wsStatus === 'connecting'
            ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 animate-pulse"><Wifi className="w-3 h-3" /> Connecting…</Badge>
            : <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1"><WifiOff className="w-3 h-3" /> Offline</Badge>
          }
          <Button size="sm" variant="outline" className="text-xs" onClick={connect}>
            <RefreshCw className="w-3 h-3 mr-1" /> Reconnect
          </Button>
        </div>
      </div>

      {/* ── Geofence breach banner ── */}
      {outsideGeo.length > 0 && sos.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-400/30">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {outsideGeo.length === 1 ? '1 Guard Outside Geofence' : `${outsideGeo.length} Guards Outside Geofence`}
            </p>
            <p className="text-xs text-amber-100 truncate">
              {outsideGeo.map(g => g.guardName || `Guard #${g.guardId}`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-3">
        <Card className={`border-0 shadow-sm bg-white dark:bg-slate-900 ${ sos.length > 0 ? 'ring-1 ring-red-300 bg-red-50 dark:bg-red-950/20' : '' }`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${ sos.length > 0 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-red-50 text-red-400 dark:bg-red-500/10' }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">SOS Active</p>
              <p className={`text-xl font-bold ${ sos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300' }`}>{sos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm bg-white dark:bg-slate-900 ${ outsideGeo.length > 0 ? 'ring-1 ring-amber-300 bg-amber-50 dark:bg-amber-950/20' : '' }`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${ outsideGeo.length > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-amber-50 text-amber-400 dark:bg-amber-500/10' }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Outside Geo</p>
              <p className={`text-xl font-bold ${ outsideGeo.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300' }`}>{outsideGeo.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">On Duty</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{onDuty.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Off Duty</p>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{off.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>{g.guardName || `Guard #${g.guardId}`}</p>
                    <p style={{
                      color: g.severity === 'sos' ? '#ef4444'
                           : (g.clockedIn && g.inGeofence === false) ? '#f59e0b'
                           : g.clockedIn ? '#22c55e'
                           : '#94a3b8',
                      fontSize: 12, marginBottom: 4
                    }}>
                      {g.severity === 'sos' ? '🚨 SOS ACTIVE'
                        : (g.clockedIn && g.inGeofence === false) ? '⚠️ Outside Geofence'
                        : g.clockedIn ? '✅ On Duty'
                        : '⚫ Off Duty'}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Lat: {g.lat?.toFixed(5)}</p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Lng: {g.lng?.toFixed(5)}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Updated: {formatTS(g.timestamp)}
                    </p>                    {g.severity === 'sos' && (
                      <button
                        onClick={() => handleAcknowledge(g.guardId)}
                        disabled={ackingId === g.guardId}
                        style={{
                          marginTop: 8, width: '100%', padding: '6px 0',
                          background: ackingId === g.guardId ? '#fca5a5' : '#ef4444',
                          color: '#fff', border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {ackingId === g.guardId ? 'Clearing\u2026' : '\u2713 Acknowledge SOS'}
                      </button>
                    )}                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* ── Guard list (SOS first) ── */}
      {guards.length > 0 && (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Guards</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...sos, ...outsideGeo, ...onDuty, ...off].map(g => (
                <div key={g.guardId} className={`flex items-center justify-between py-2 text-sm ${
                  g.severity === 'sos' ? 'bg-red-50 dark:bg-red-950/10 -mx-2 px-2 rounded-lg'
                : (g.clockedIn && g.inGeofence === false) ? 'bg-amber-50 dark:bg-amber-950/10 -mx-2 px-2 rounded-lg'
                : ''
                }`}>
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {g.guardName || `Guard #${g.guardId}`}
                    </span>
                    <span className="block text-xs text-slate-400">{formatTS(g.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:block">{formatTS(g.timestamp)}</span>
                    {g.severity === 'sos' ? (
                      <>
                        <Badge className="bg-red-600 text-white text-xs animate-pulse">\uD83D\uDEA8 SOS</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(g.guardId)}
                          disabled={ackingId === g.guardId}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white border-0 h-7 px-2"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {ackingId === g.guardId ? '\u2026' : 'Ack'}
                        </Button>
                      </>
                    ) : (g.clockedIn && g.inGeofence === false) ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">Outside Geo</Badge>
                    ) : g.clockedIn ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">On Duty</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs">Off Duty</Badge>
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
