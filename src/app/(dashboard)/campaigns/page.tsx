"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin, Clock, Camera, Play, Square, AlertTriangle,
  CheckCircle, XCircle, ChevronRight, Footprints, Trophy
} from "lucide-react";

interface CampaignSession {
  id: string;
  status: string;
  startLat: number;
  startLng: number;
  endLat: number | null;
  endLng: number | null;
  distanceMeters: number | null;
  durationMinutes: number | null;
  pointsEarned: number;
  notes: string | null;
  adminReview: string | null;
  startedAt: string;
  endedAt: string | null;
  _count: { photos: number; gpsTrail: number };
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [activeSession, setActiveSession] = useState<CampaignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<string>("idle");
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions);
      const active = data.sessions.find((s: CampaignSession) => s.status === "ACTIVE");
      setActiveSession(active || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // GPS tracking while session is active
  useEffect(() => {
    if (!activeSession) {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      return;
    }

    const trackGps = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setGpsStatus("tracking");
          await fetch(`/api/campaigns/${activeSession.id}/gps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
        },
        () => setGpsStatus("error"),
        { enableHighAccuracy: true }
      );
    };

    // Track every 30 seconds
    trackGps();
    gpsIntervalRef.current = setInterval(trackGps, 30000);
    return () => { if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current); };
  }, [activeSession]);

  const startCampaign = async () => {
    setStarting(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
        if (res.ok) {
          await fetchSessions();
        } else {
          const err = await res.json();
          setError(err.error);
        }
        setStarting(false);
      },
      (err) => {
        setError("GPS access denied. Please enable location services.");
        setStarting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const endCampaign = async () => {
    if (!activeSession) return;
    setEnding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch(`/api/campaigns/${activeSession.id}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
        if (res.ok) {
          await fetchSessions();
        }
        setEnding(false);
      },
      async () => {
        // End without final GPS
        await fetch(`/api/campaigns/${activeSession.id}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        await fetchSessions();
        setEnding(false);
      }
    );
  };

  const uploadPhoto = async () => {
    if (!activeSession) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Convert to base64 (TODO: proper file storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoUrl = reader.result as string;

        // Get current GPS for geotag
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await fetch(`/api/campaigns/${activeSession.id}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                photoUrl,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
            await fetchSessions();
          },
          async () => {
            await fetch(`/api/campaigns/${activeSession.id}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoUrl }),
            });
            await fetchSessions();
          }
        );
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const statusColor = (s: CampaignSession) => {
    if (s.status === "ACTIVE") return "text-green-500";
    if (s.status === "FLAGGED") return "text-yellow-500";
    if (s.adminReview === "APPROVED") return "text-green-500";
    if (s.adminReview === "REJECTED") return "text-red-500";
    return "text-label-secondary";
  };

  const statusIcon = (s: CampaignSession) => {
    if (s.status === "ACTIVE") return <Play size={14} className="text-green-500" />;
    if (s.status === "FLAGGED") return <AlertTriangle size={14} className="text-yellow-500" />;
    if (s.adminReview === "APPROVED") return <CheckCircle size={14} className="text-green-500" />;
    if (s.adminReview === "REJECTED") return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-label-tertiary" />;
  };

  if (loading) return <div className="p-6 text-center text-label-secondary">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Active Session Banner */}
      {activeSession ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 font-semibold text-sm">Campaign Active</span>
            <span className="text-label-tertiary text-xs ml-auto">
              {gpsStatus === "tracking" ? "GPS tracking" : gpsStatus === "error" ? "GPS error" : "Starting..."}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-label-secondary">
            <span className="flex items-center gap-1"><Clock size={12} />
              Started {new Date(activeSession.startedAt).toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1"><Camera size={12} />
              {activeSession._count?.photos || 0} photos
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={uploadPhoto}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/20 text-accent text-sm font-medium tap-scale"
            >
              <Camera size={16} /> Take Photo
            </button>
            <button
              onClick={endCampaign}
              disabled={ending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 text-red-500 text-sm font-medium tap-scale"
            >
              <Square size={16} /> {ending ? "Ending..." : "End Session"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCampaign}
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-semibold text-base tap-scale"
        >
          <Play size={20} /> {starting ? "Getting GPS..." : "Start Campaign Session"}
        </button>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-sm">{error}</div>
      )}

      {/* Points Summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-surface-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-accent">{sessions.filter(s => s.status !== "CANCELLED").reduce((a, s) => a + s.pointsEarned, 0)}</div>
          <div className="text-xs text-label-tertiary">Campaign Points</div>
        </div>
        <div className="flex-1 bg-surface-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-label-primary">{sessions.filter(s => s.status === "COMPLETED").length}</div>
          <div className="text-xs text-label-tertiary">Sessions</div>
        </div>
        <div className="flex-1 bg-surface-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-label-primary">
            {formatDistance(sessions.reduce((a, s) => a + (s.distanceMeters || 0), 0))}
          </div>
          <div className="text-xs text-label-tertiary">Distance</div>
        </div>
      </div>

      {/* Session History */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-label-primary px-1">Session History</h3>
        {sessions.filter(s => s.status !== "ACTIVE").length === 0 ? (
          <div className="bg-surface-primary rounded-xl p-6 text-center text-label-tertiary text-sm">
            No completed sessions yet. Start your first campaign!
          </div>
        ) : (
          sessions.filter(s => s.status !== "ACTIVE").map((s) => (
            <div
              key={s.id}
              className="bg-surface-primary rounded-xl p-3 flex items-center gap-3 tap-scale"
              onClick={() => {/* TODO: detail view */}}
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                {statusIcon(s)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-label-primary">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </span>
                  <span className={`text-xs font-medium ${statusColor(s)}`}>
                    {s.status === "FLAGGED" ? "Flagged" : s.adminReview === "APPROVED" ? "Approved" : s.adminReview === "REJECTED" ? "Rejected" : "Pending Review"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-label-tertiary mt-0.5">
                  {s.durationMinutes && <span className="flex items-center gap-1"><Clock size={10} />{formatDuration(s.durationMinutes)}</span>}
                  {s.distanceMeters && <span className="flex items-center gap-1"><Footprints size={10} />{formatDistance(s.distanceMeters)}</span>}
                  <span className="flex items-center gap-1"><Camera size={10} />{s._count?.photos || 0}</span>
                  {s.pointsEarned > 0 && <span className="flex items-center gap-1 text-accent"><Trophy size={10} />+{s.pointsEarned}</span>}
                </div>
              </div>
              <ChevronRight size={16} className="text-label-tertiary" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
