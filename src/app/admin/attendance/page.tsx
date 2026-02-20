"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Users, CheckCircle, XCircle, Clock, Trash2, Edit3, BarChart3, ToggleLeft, ToggleRight } from "lucide-react";

interface Zone {
  id: string; name: string; nameUrdu?: string; type: string; latitude: number; longitude: number;
  radiusMeters: number; startTime?: string; endTime?: string; isActive: boolean; isRecurring: boolean;
  todayCount: number; totalRecords: number; district?: { name: string };
}

interface Stats {
  today: { verified: number; rejected: number; uniqueMembers: number };
  week: { total: number }; total: number; activeZones: number;
  topAttendees: { name: string; membershipNo: string; count: number }[];
  dailyBreakdown: { date: string; count: number }[];
}

export default function AdminAttendancePage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nameUrdu: "", type: "office", latitude: "", longitude: "", radiusMeters: "100", startTime: "09:00", endTime: "17:00", isRecurring: true });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAll = async () => {
    const [z, s, r] = await Promise.all([
      fetch("/api/attendance/zones").then(r => r.json()),
      fetch("/api/attendance/stats").then(r => r.json()),
      fetch(`/api/attendance?limit=50&date=${filterDate}`).then(r => r.json()),
    ]);
    setZones(z.zones || []);
    setStats(s);
    setRecords(r.records || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [filterDate]);

  const createZone = async () => {
    if (!form.name || !form.latitude || !form.longitude) return alert("Name, latitude, and longitude required");
    await fetch("/api/attendance/zones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", nameUrdu: "", type: "office", latitude: "", longitude: "", radiusMeters: "100", startTime: "09:00", endTime: "17:00", isRecurring: true });
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

  const typeColors: Record<string, string> = { office: "text-blue-400 bg-blue-500/10", event: "text-purple-400 bg-purple-500/10", rally: "text-orange-400 bg-orange-500/10", meeting: "text-green-400 bg-green-500/10" };

  if (loading) return <div className="p-6"><div className="skeleton h-8 w-48 mb-4" /><div className="skeleton h-64 rounded-xl" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-gray-400 mt-1">GPS-verified attendance zones and records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90">
          <Plus className="w-4 h-4" /> New Zone
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.today.verified}</div>
            <div className="text-xs text-gray-400 mt-1">Today Verified</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{stats.today.rejected}</div>
            <div className="text-xs text-gray-400 mt-1">Today Rejected</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.today.uniqueMembers}</div>
            <div className="text-xs text-gray-400 mt-1">Unique Members</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.week.total}</div>
            <div className="text-xs text-gray-400 mt-1">This Week</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.activeZones}</div>
            <div className="text-xs text-gray-400 mt-1">Active Zones</div>
          </div>
        </div>
      )}

      {/* Create Zone Form */}
      {showForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-4">Create Attendance Zone</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Main Office" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name (Urdu)</label>
              <input value={form.nameUrdu} onChange={e => setForm(f => ({ ...f, nameUrdu: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" dir="rtl" placeholder="مرکزی دفتر" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                <option value="office">Office</option>
                <option value="event">Event</option>
                <option value="rally">Rally</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Latitude *</label>
              <div className="flex gap-2">
                <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="24.8607" />
                <button onClick={getMyLocation} className="text-xs text-primary font-semibold px-2 border border-primary/30 rounded-lg hover:bg-primary/10">GPS</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Longitude *</label>
              <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="67.0011" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Radius (meters)</label>
              <input type="number" value={form.radiusMeters} onChange={e => setForm(f => ({ ...f, radiusMeters: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createZone} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold">Create Zone</button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zones */}
        <div className="lg:col-span-1">
          <h2 className="font-bold mb-3 text-sm text-gray-400 uppercase tracking-wide">Zones ({zones.length})</h2>
          <div className="space-y-2">
            {zones.map(zone => (
              <div key={zone.id} className={`bg-gray-800/50 border rounded-xl p-4 ${zone.isActive ? "border-gray-700" : "border-gray-800 opacity-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${typeColors[zone.type] || typeColors.office}`}>{zone.type}</span>
                  <span className="font-semibold text-sm flex-1">{zone.name}</span>
                  <button onClick={() => toggleZone(zone.id, zone.isActive)} className="text-gray-500 hover:text-primary">
                    {zone.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteZone(zone.id)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex gap-3">
                    <span>{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                    <span>{zone.radiusMeters}m</span>
                  </div>
                  {zone.startTime && <div>{zone.startTime} - {zone.endTime}</div>}
                  <div className="flex gap-3 text-gray-500">
                    <span>{zone.todayCount} today</span>
                    <span>{zone.totalRecords} total</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wide">Records</h2>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs" />
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-xs text-gray-400">
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Zone</th>
                  <th className="text-left p-3">Time</th>
                  <th className="text-center p-3">Distance</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3">
                      <div className="font-medium text-xs">{r.member.name}</div>
                      <div className="text-[10px] text-gray-500">{r.member.membershipNo}</div>
                    </td>
                    <td className="p-3 text-xs">{r.zone.name}</td>
                    <td className="p-3 text-xs text-gray-400">{new Date(r.checkInTime).toLocaleTimeString()}</td>
                    <td className="p-3 text-xs text-center">{r.distanceMeters}m</td>
                    <td className="p-3 text-center">
                      {r.status === "verified" ? <CheckCircle className="w-4 h-4 text-green-400 inline" /> : <XCircle className="w-4 h-4 text-red-400 inline" />}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 text-xs">No records for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top Attendees */}
          {stats?.topAttendees && stats.topAttendees.length > 0 && (
            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-xs text-gray-400 uppercase mb-3">Top Attendees (7 days)</h3>
              <div className="space-y-2">
                {stats.topAttendees.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                    <span className="flex-1 font-medium">{a.name}</span>
                    <span className="text-xs text-gray-400">{a.membershipNo}</span>
                    <span className="text-xs font-bold text-primary">{a.count} check-ins</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
