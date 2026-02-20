"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Navigation, History, Shield } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  nameUrdu?: string;
  type: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  todayCount: number;
}

interface AttendanceRecord {
  id: string;
  checkInTime: string;
  status: string;
  distanceMeters: number;
  zone: { name: string; type: string };
}

interface Stats {
  today: { verified: number; rejected: number };
  week: { total: number };
  total: number;
  dailyBreakdown: { date: string; count: number }[];
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const [zones, setZones] = useState<Zone[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "error">("idle");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [tab, setTab] = useState<"checkin" | "history">("checkin");

  const fetchData = useCallback(async () => {
    try {
      const [zonesRes, recordsRes, statsRes] = await Promise.all([
        fetch("/api/attendance/zones").then(r => r.json()),
        fetch("/api/attendance?limit=20").then(r => r.json()),
        fetch("/api/attendance/stats").then(r => r.json()),
      ]);
      setZones(zonesRes.zones || []);
      setRecords(recordsRes.records || []);
      setStats(statsRes);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getLocation = () => {
    setGpsStatus("getting");
    setResult(null);
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setResult({ success: false, message: "Geolocation not supported by your browser" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("got");
      },
      (err) => {
        setGpsStatus("error");
        setResult({ success: false, message: `Location error: ${err.message}. Please enable GPS.` });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const checkIn = async (zoneId: string) => {
    if (!userLocation) { getLocation(); setSelectedZone(zoneId); return; }
    setCheckingIn(true);
    setResult(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          accuracy: userLocation.accuracy,
          zoneId,
          deviceInfo: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message || "Attendance marked!" });
        fetchData();
      } else {
        setResult({ success: false, message: data.error || "Check-in failed" });
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || "Network error" });
    }
    setCheckingIn(false);
  };

  // Auto check-in after getting location
  useEffect(() => {
    if (gpsStatus === "got" && selectedZone) {
      checkIn(selectedZone);
      setSelectedZone(null);
    }
  }, [gpsStatus, selectedZone]);

  const typeIcons: { [key: string]: string } = { office: "🏢", event: "🎪", rally: "📢", meeting: "🤝" };
  const typeColors: { [key: string]: string } = { office: "bg-blue-500/10 text-blue-400", event: "bg-purple-500/10 text-purple-400", rally: "bg-orange-500/10 text-orange-400", meeting: "bg-green-500/10 text-green-400" };

  if (loading) return (
    <div className="px-5 pt-3 pb-24 space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-32 rounded-apple-xl" />
      <div className="skeleton h-32 rounded-apple-xl" />
    </div>
  );

  return (
    <div className="px-5 pt-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          <p className="text-xs text-secondary mt-0.5">GPS-verified check-in</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("checkin")} className={`px-3 py-1.5 rounded-apple text-xs font-semibold transition-all ${tab === "checkin" ? "bg-primary text-white" : "glass text-secondary"}`}>Check In</button>
          <button onClick={() => setTab("history")} className={`px-3 py-1.5 rounded-apple text-xs font-semibold transition-all ${tab === "history" ? "bg-primary text-white" : "glass text-secondary"}`}>History</button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass rounded-apple-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.today.verified}</div>
            <div className="text-[10px] text-secondary mt-0.5">Today</div>
          </div>
          <div className="glass rounded-apple-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">{stats.week.total}</div>
            <div className="text-[10px] text-secondary mt-0.5">This Week</div>
          </div>
          <div className="glass rounded-apple-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-secondary mt-0.5">All Time</div>
          </div>
        </div>
      )}

      {/* Result message */}
      {result && (
        <div className={`rounded-apple-lg p-4 mb-4 flex items-center gap-3 ${result.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
          {result.success ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
          <p className={`text-sm font-medium ${result.success ? "text-green-400" : "text-red-400"}`}>{result.message}</p>
        </div>
      )}

      {tab === "checkin" ? (
        <>
          {/* GPS Status */}
          <div className="glass rounded-apple-lg p-3 mb-4 flex items-center gap-3">
            <Navigation className={`w-4 h-4 ${gpsStatus === "got" ? "text-green-400" : gpsStatus === "getting" ? "text-yellow-400 animate-pulse" : "text-secondary"}`} />
            <div className="flex-1">
              <div className="text-xs font-semibold">
                {gpsStatus === "idle" && "Tap a zone to get GPS location"}
                {gpsStatus === "getting" && "Getting your location..."}
                {gpsStatus === "got" && `Location: ${userLocation?.lat.toFixed(5)}, ${userLocation?.lng.toFixed(5)}`}
                {gpsStatus === "error" && "Location unavailable"}
              </div>
              {userLocation && <div className="text-[10px] text-secondary">Accuracy: {Math.round(userLocation.accuracy)}m</div>}
            </div>
            {gpsStatus !== "getting" && (
              <button onClick={getLocation} className="text-[10px] text-primary font-semibold">
                {gpsStatus === "got" ? "Refresh" : "Get GPS"}
              </button>
            )}
          </div>

          {/* Zone list */}
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Active Zones</h2>
          {zones.length === 0 ? (
            <div className="glass rounded-apple-lg p-8 text-center">
              <Shield className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm text-secondary">No attendance zones set up yet</p>
              <p className="text-xs text-secondary/60 mt-1">Ask your admin to create zones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.filter(z => z.isActive).map(zone => (
                <div key={zone.id} className="glass rounded-apple-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-apple flex items-center justify-center text-lg ${typeColors[zone.type] || typeColors.office}`}>
                      {typeIcons[zone.type] || "📍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{zone.name}</div>
                      {zone.nameUrdu && <div className="text-xs text-secondary" dir="rtl">{zone.nameUrdu}</div>}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-secondary">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{zone.radiusMeters}m radius</span>
                        {zone.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{zone.startTime} - {zone.endTime}</span>}
                        <span>{zone.todayCount} today</span>
                      </div>
                    </div>
                    <button
                      onClick={() => checkIn(zone.id)}
                      disabled={checkingIn}
                      className="bg-primary text-white px-4 py-2 rounded-apple text-xs font-bold disabled:opacity-50 transition-all active:scale-95"
                    >
                      {checkingIn ? "..." : "Check In"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History */}
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Recent Check-ins</h2>
          {records.length === 0 ? (
            <div className="glass rounded-apple-lg p-8 text-center">
              <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm text-secondary">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id} className="glass rounded-apple-lg p-3 flex items-center gap-3">
                  {r.status === "verified" ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{r.zone.name}</div>
                    <div className="text-[10px] text-secondary">
                      {new Date(r.checkInTime).toLocaleDateString()} at {new Date(r.checkInTime).toLocaleTimeString()} — {r.distanceMeters}m away
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${r.status === "verified" ? "text-green-400" : "text-red-400"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Weekly chart */}
      {stats && stats.dailyBreakdown && (
        <div className="glass rounded-apple-lg p-4 mt-4">
          <h3 className="text-xs font-bold mb-3">7-Day Trend</h3>
          <div className="flex items-end gap-1.5 h-16">
            {stats.dailyBreakdown.map((d, i) => {
              const max = Math.max(...stats.dailyBreakdown.map(x => x.count), 1);
              const h = (d.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] text-secondary">{d.count}</div>
                  <div className="w-full rounded-t" style={{ height: `${Math.max(h, 4)}%`, background: d.count > 0 ? "var(--color-primary)" : "rgba(136,136,170,0.1)" }} />
                  <div className="text-[8px] text-secondary">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
