"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Users, CheckCircle, XCircle, Clock, Trash2, ToggleLeft, ToggleRight, Navigation, Search, ChevronDown, BarChart3, Shield, Award, TrendingUp, Eye, EyeOff, Crosshair } from "lucide-react";

interface Zone {
  id: string; name: string; nameUrdu?: string; type: string; latitude: number; longitude: number;
  radiusMeters: number; startTime?: string; endTime?: string; isActive: boolean;
  todayCount: number; totalRecords: number; district?: { name: string };
}

interface Stats {
  today: { verified: number; rejected: number; uniqueMembers: number };
  week: { total: number }; total: number; activeZones: number;
  topAttendees: { name: string; membershipNumber: string; count: number }[];
  dailyBreakdown: { date: string; count: number }[];
}

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  office: { label: "Office", emoji: "🏢", color: "text-blue-600", bg: "bg-blue-50" },
  event: { label: "Event", emoji: "🎪", color: "text-purple-600", bg: "bg-purple-50" },
  rally: { label: "Rally", emoji: "📢", color: "text-orange-600", bg: "bg-orange-50" },
  meeting: { label: "Meeting", emoji: "🤝", color: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function AdminAttendancePage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"overview" | "zones" | "records">("overview");
  const [form, setForm] = useState({ name: "", nameUrdu: "", type: "office", latitude: "", longitude: "", radiusMeters: "100", startTime: "09:00", endTime: "17:00" });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    try {
      const [z, s, r] = await Promise.all([
        fetch("/api/attendance/zones").then(r => r.json()),
        fetch("/api/attendance/stats").then(r => r.json()),
        fetch(`/api/attendance?limit=50&date=${filterDate}`).then(r => r.json()),
      ]);
      setZones(z.zones || []);
      setStats(s);
      setRecords(r.records || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [filterDate]);

  const createZone = async () => {
    if (!form.name || !form.latitude || !form.longitude) return;
    setCreating(true);
    await fetch("/api/attendance/zones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", nameUrdu: "", type: "office", latitude: "", longitude: "", radiusMeters: "100", startTime: "09:00", endTime: "17:00" });
    setCreating(false);
    fetchAll();
  };

  const toggleZone = async (id: string, isActive: boolean) => {
    await fetch(`/api/attendance/zones/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAll();
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Delete this zone and all its records?")) return;
    await fetch(`/api/attendance/zones/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const getMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      () => alert("Could not get location"),
      { enableHighAccuracy: true }
    );
  };

  if (loading) return (
    <div className="px-5 pt-4 pb-24 space-y-4">
      <div className="skeleton h-8 w-48 rounded-apple" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-apple-lg" />)}
      </div>
      <div className="skeleton h-40 rounded-apple-lg" />
    </div>
  );

  return (
    <div className="px-5 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title-lg text-label-primary font-bold">Attendance</h1>
          <p className="text-caption-sm text-label-tertiary mt-0.5">GPS-verified zones & records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-white px-4 py-2.5 rounded-apple-lg text-callout font-semibold flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
        >
          <Plus size={16} /> New Zone
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-emerald-50 rounded-apple-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-caption-sm text-emerald-700 font-medium">Today Verified</span>
            </div>
            <div className="text-title-lg font-bold text-emerald-700">{stats.today.verified}</div>
          </div>
          <div className="bg-red-50 rounded-apple-xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-red-500" />
              <span className="text-caption-sm text-red-600 font-medium">Today Rejected</span>
            </div>
            <div className="text-title-lg font-bold text-red-600">{stats.today.rejected}</div>
          </div>
          <div className="bg-blue-50 rounded-apple-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-600" />
              <span className="text-caption-sm text-blue-700 font-medium">Unique Today</span>
            </div>
            <div className="text-title-lg font-bold text-blue-700">{stats.today.uniqueMembers}</div>
          </div>
          <div className="bg-amber-50 rounded-apple-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-amber-600" />
              <span className="text-caption-sm text-amber-700 font-medium">This Week</span>
            </div>
            <div className="text-title-lg font-bold text-amber-700">{stats.week.total}</div>
          </div>
        </div>
      )}

      {/* 7-Day Chart */}
      {stats?.dailyBreakdown && (
        <div className="bg-surface-primary rounded-apple-xl p-4 mb-5 border border-separator">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-callout font-bold text-label-primary">7-Day Trend</h3>
            <span className="text-caption-sm text-label-tertiary">{stats.total} total all time</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {stats.dailyBreakdown.map((d, i) => {
              const max = Math.max(...stats.dailyBreakdown.map(x => x.count), 1);
              const h = (d.count / max) * 100;
              const isToday = i === stats.dailyBreakdown.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-caption-sm font-semibold text-label-secondary">{d.count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${isToday ? "bg-accent" : "bg-fill-secondary"}`}
                    style={{ height: `${Math.max(h, 6)}%` }}
                  />
                  <span className="text-caption-sm text-label-quaternary">{d.date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-fill-secondary rounded-apple-lg p-1 mb-5">
        {(["overview", "zones", "records"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-apple text-callout font-semibold transition-all capitalize ${
              tab === t ? "bg-surface-primary text-label-primary shadow-sm" : "text-label-tertiary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Create Zone Sheet */}
      {showForm && (
        <div className="bg-surface-primary rounded-apple-xl p-5 mb-5 border border-separator shadow-sm">
          <h2 className="text-body font-bold text-label-primary mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-accent" /> Create Zone
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">Name *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary placeholder:text-label-quaternary"
                  placeholder="Main Office"
                />
              </div>
              <div>
                <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">اردو نام</label>
                <input
                  value={form.nameUrdu} onChange={e => setForm(f => ({ ...f, nameUrdu: e.target.value }))}
                  className="w-full bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary text-right"
                  dir="rtl" placeholder="مرکزی دفتر"
                />
              </div>
            </div>

            <div>
              <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, type: key }))}
                    className={`py-2.5 rounded-apple-lg text-caption-sm font-semibold border transition-all ${
                      form.type === key
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : "bg-fill-secondary text-label-tertiary border-separator"
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-caption-sm text-label-tertiary font-medium">Location *</label>
                <button onClick={getMyLocation} className="text-caption-sm text-accent font-semibold flex items-center gap-1 active:opacity-60">
                  <Crosshair size={12} /> Use My GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                  className="bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary placeholder:text-label-quaternary"
                  placeholder="Latitude" type="number" step="any"
                />
                <input
                  value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                  className="bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary placeholder:text-label-quaternary"
                  placeholder="Longitude" type="number" step="any"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">Radius (m)</label>
                <input
                  type="number" value={form.radiusMeters} onChange={e => setForm(f => ({ ...f, radiusMeters: e.target.value }))}
                  className="w-full bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary"
                />
              </div>
              <div>
                <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">Start</label>
                <input
                  type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary"
                />
              </div>
              <div>
                <label className="text-caption-sm text-label-tertiary font-medium mb-1 block">End</label>
                <input
                  type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={createZone} disabled={creating || !form.name || !form.latitude || !form.longitude}
                className="flex-1 bg-accent text-white py-3 rounded-apple-lg text-callout font-bold disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {creating ? "Creating..." : "Create Zone"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-3 rounded-apple-lg text-callout text-label-tertiary font-medium bg-fill-secondary active:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Active Zones Summary */}
          <div className="bg-surface-primary rounded-apple-xl border border-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-separator flex items-center justify-between">
              <h3 className="text-callout font-bold text-label-primary flex items-center gap-2">
                <MapPin size={16} className="text-accent" /> Active Zones
              </h3>
              <span className="text-caption-sm text-label-tertiary">{stats?.activeZones || 0} zones</span>
            </div>
            {zones.filter(z => z.isActive).length === 0 ? (
              <div className="p-8 text-center">
                <Shield size={32} className="text-label-quaternary mx-auto mb-2" />
                <p className="text-callout text-label-tertiary">No zones yet</p>
                <p className="text-caption-sm text-label-quaternary mt-1">Tap "New Zone" to create one</p>
              </div>
            ) : (
              <div className="divide-y divide-separator">
                {zones.filter(z => z.isActive).map(zone => {
                  const cfg = TYPE_CONFIG[zone.type] || TYPE_CONFIG.office;
                  return (
                    <div key={zone.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-apple-lg flex items-center justify-center text-lg ${cfg.bg}`}>
                        {cfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-callout font-semibold text-label-primary">{zone.name}</div>
                        <div className="text-caption-sm text-label-tertiary flex items-center gap-2">
                          <span>{zone.radiusMeters}m</span>
                          {zone.startTime && <span>• {zone.startTime}–{zone.endTime}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-callout font-bold text-accent">{zone.todayCount}</div>
                        <div className="text-caption-sm text-label-quaternary">today</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Attendees */}
          {stats?.topAttendees && stats.topAttendees.length > 0 && (
            <div className="bg-surface-primary rounded-apple-xl border border-separator overflow-hidden">
              <div className="px-4 py-3 border-b border-separator">
                <h3 className="text-callout font-bold text-label-primary flex items-center gap-2">
                  <Award size={16} className="text-amber-500" /> Top Attendees (7 days)
                </h3>
              </div>
              <div className="divide-y divide-separator">
                {stats.topAttendees.map((a, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-callout font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-fill-secondary text-label-tertiary"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-callout font-semibold text-label-primary truncate">{a.name}</div>
                      <div className="text-caption-sm text-label-quaternary">{a.membershipNumber}</div>
                    </div>
                    <div className="bg-accent/10 px-3 py-1 rounded-apple">
                      <span className="text-caption-sm font-bold text-accent">{a.count} check-ins</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zones Tab */}
      {tab === "zones" && (
        <div className="space-y-3">
          {zones.length === 0 ? (
            <div className="bg-surface-primary rounded-apple-xl border border-separator p-8 text-center">
              <MapPin size={32} className="text-label-quaternary mx-auto mb-2" />
              <p className="text-callout text-label-tertiary">No attendance zones created</p>
            </div>
          ) : zones.map(zone => {
            const cfg = TYPE_CONFIG[zone.type] || TYPE_CONFIG.office;
            return (
              <div key={zone.id} className={`bg-surface-primary rounded-apple-xl border overflow-hidden transition-opacity ${zone.isActive ? "border-separator" : "border-separator opacity-50"}`}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-apple-lg flex items-center justify-center text-xl ${cfg.bg}`}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-bold text-label-primary">{zone.name}</span>
                      <span className={`text-caption-sm px-2 py-0.5 rounded-apple font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {zone.nameUrdu && <div className="text-caption-sm text-label-tertiary" dir="rtl">{zone.nameUrdu}</div>}
                    <div className="text-caption-sm text-label-quaternary mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>📍 {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                      <span>📏 {zone.radiusMeters}m</span>
                      {zone.startTime && <span>🕐 {zone.startTime}–{zone.endTime}</span>}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-fill-secondary border-t border-separator flex items-center justify-between">
                  <div className="flex gap-4 text-caption-sm">
                    <span className="text-emerald-600 font-semibold">{zone.todayCount} today</span>
                    <span className="text-label-tertiary">{zone.totalRecords} total</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleZone(zone.id, zone.isActive)} className="active:opacity-60">
                      {zone.isActive
                        ? <ToggleRight size={22} className="text-emerald-500" />
                        : <ToggleLeft size={22} className="text-label-quaternary" />
                      }
                    </button>
                    <button onClick={() => deleteZone(zone.id)} className="text-label-quaternary active:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Records Tab */}
      {tab === "records" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="flex-1 bg-fill-secondary border border-separator rounded-apple-lg px-3 py-2.5 text-callout text-label-primary"
            />
          </div>

          <div className="bg-surface-primary rounded-apple-xl border border-separator overflow-hidden">
            {records.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={32} className="text-label-quaternary mx-auto mb-2" />
                <p className="text-callout text-label-tertiary">No records for {filterDate}</p>
              </div>
            ) : (
              <div className="divide-y divide-separator">
                {records.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      r.status === "verified" ? "bg-emerald-50" : "bg-red-50"
                    }`}>
                      {r.status === "verified"
                        ? <CheckCircle size={16} className="text-emerald-600" />
                        : <XCircle size={16} className="text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-callout font-semibold text-label-primary truncate">{r.member?.name || "Unknown"}</div>
                      <div className="text-caption-sm text-label-tertiary">
                        {r.zone?.name} • {new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-caption-sm font-semibold text-label-secondary">{r.distanceMeters}m</div>
                      <div className={`text-caption-sm font-bold ${r.status === "verified" ? "text-emerald-600" : "text-red-500"}`}>
                        {r.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
