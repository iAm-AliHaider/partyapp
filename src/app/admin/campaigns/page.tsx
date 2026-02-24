"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin, Clock, Camera, CheckCircle, XCircle, AlertTriangle,
  Footprints, Trophy, ChevronDown, ExternalLink, Hash, Eye
} from "lucide-react";

interface CampaignSession {
  id: string;
  status: string;
  startLat: number;
  startLng: number;
  distanceMeters: number | null;
  durationMinutes: number | null;
  pointsEarned: number;
  notes: string | null;
  adminReview: string | null;
  startedAt: string;
  endedAt: string | null;
  member: { id: string; name: string; photoUrl: string | null; district?: { name: string } };
  photos: { id: string; photoUrl: string; verified: boolean }[];
  _count: { photos: number; gpsTrail: number };
}

interface HashtagSubmission {
  id: string;
  platform: string;
  postUrl: string;
  hashtag: string;
  status: string;
  pointsAwarded: number;
  createdAt: string;
  member: { id: string; name: string; photoUrl: string | null; district?: { name: string } };
}

export default function AdminCampaignsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"campaigns" | "hashtags">("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignSession[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSubmission[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [cRes, hRes] = await Promise.all([
      fetch("/api/campaigns?limit=50"),
      fetch("/api/hashtags?limit=50"),
    ]);
    if (cRes.ok) { const d = await cRes.json(); setCampaigns(d.sessions); }
    if (hRes.ok) { const d = await hRes.json(); setHashtags(d.submissions); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const reviewCampaign = async (id: string, adminReview: string) => {
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReview }),
    });
    await fetchData();
  };

  const reviewHashtag = async (id: string, status: string) => {
    await fetch(`/api/hashtags/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === "pending") return c.adminReview === "PENDING";
    if (filter === "flagged") return c.status === "FLAGGED";
    if (filter === "approved") return c.adminReview === "APPROVED";
    if (filter === "rejected") return c.adminReview === "REJECTED";
    return true;
  });

  const filteredHashtags = hashtags.filter(h => {
    if (filter === "pending") return h.status === "PENDING";
    if (filter === "approved") return h.status === "APPROVED";
    if (filter === "rejected") return h.status === "REJECTED";
    return true;
  });

  const pendingCampaigns = campaigns.filter(c => c.adminReview === "PENDING" || c.status === "FLAGGED").length;
  const pendingHashtags = hashtags.filter(h => h.status === "PENDING").length;

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Campaign & Social Review</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{pendingCampaigns}</div>
          <div className="text-xs text-gray-500">Pending Campaigns</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{pendingHashtags}</div>
          <div className="text-xs text-gray-500">Pending Hashtags</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{campaigns.filter(c => c.adminReview === "APPROVED").length}</div>
          <div className="text-xs text-gray-500">Approved</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-600">{campaigns.filter(c => c.status === "FLAGGED").length}</div>
          <div className="text-xs text-gray-500">Flagged</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab("campaigns")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "campaigns" ? "bg-white shadow" : "text-gray-500"}`}>
          Campaigns {pendingCampaigns > 0 && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">{pendingCampaigns}</span>}
        </button>
        <button onClick={() => setTab("hashtags")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === "hashtags" ? "bg-white shadow" : "text-gray-500"}`}>
          Hashtags {pendingHashtags > 0 && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">{pendingHashtags}</span>}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "flagged", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === f ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Campaigns Tab ─── */}
      {tab === "campaigns" && (
        <div className="space-y-3">
          {filteredCampaigns.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">No campaigns match filter</div>
          ) : filteredCampaigns.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {c.member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.member.name}</span>
                    {c.status === "FLAGGED" && <AlertTriangle size={14} className="text-yellow-500" />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {c.member.district?.name} · {new Date(c.startedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {c.durationMinutes && <span className="text-gray-500">{c.durationMinutes}m</span>}
                  {c.distanceMeters && <span className="text-gray-500">{c.distanceMeters}m</span>}
                  <span className="font-medium text-green-600">+{c.pointsEarned}pts</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`} />
              </div>

              {expandedId === c.id && (
                <div className="border-t border-gray-100 p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-400">Duration:</span> {c.durationMinutes || "—"}min</div>
                    <div><span className="text-gray-400">Distance:</span> {c.distanceMeters || "—"}m</div>
                    <div><span className="text-gray-400">Photos:</span> {c._count?.photos || 0}</div>
                    <div><span className="text-gray-400">GPS Points:</span> {c._count?.gpsTrail || 0}</div>
                    <div><span className="text-gray-400">Status:</span> {c.status}</div>
                    <div><span className="text-gray-400">Review:</span> {c.adminReview}</div>
                  </div>

                  {/* Photo thumbnails */}
                  {c.photos && c.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {c.photos.map(p => (
                        <img key={p.id} src={p.photoUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                      ))}
                    </div>
                  )}

                  {c.notes && <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{c.notes}</div>}

                  {(c.adminReview === "PENDING" || c.status === "FLAGGED") && (
                    <div className="flex gap-2">
                      <button onClick={() => reviewCampaign(c.id, "APPROVED")} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => reviewCampaign(c.id, "REJECTED")} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Hashtags Tab ─── */}
      {tab === "hashtags" && (
        <div className="space-y-3">
          {filteredHashtags.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">No submissions match filter</div>
          ) : filteredHashtags.map(h => (
            <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {h.member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{h.member.name}</div>
                  <div className="text-xs text-gray-400">{h.member.district?.name} · {h.platform.toLowerCase()} · {new Date(h.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  h.status === "APPROVED" ? "bg-green-100 text-green-700" :
                  h.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{h.status}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{h.hashtag}</span>
                <a href={h.postUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline truncate">
                  <ExternalLink size={12} /> {h.postUrl}
                </a>
              </div>

              {h.status === "PENDING" && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => reviewHashtag(h.id, "APPROVED")} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Approve (+5pts)
                  </button>
                  <button onClick={() => reviewHashtag(h.id, "REJECTED")} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
