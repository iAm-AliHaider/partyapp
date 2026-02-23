"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, UserPlus, UserCheck, MapPin, Star, X, Check } from "lucide-react";

function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-accent flex items-center justify-center text-white font-semibold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

type Tab = "friends" | "requests" | "suggestions";

interface Friend {
  friendshipId: string;
  id: string;
  name: string;
  photoUrl: string | null;
  district?: { name: string };
  score: number;
  since?: string;
}

interface FriendRequest {
  id: string;
  createdAt: string;
  requester: { id: string; name: string; photoUrl: string | null; district?: { name: string }; score: number };
}

interface Suggestion {
  id: string;
  name: string;
  photoUrl: string | null;
  district?: { name: string };
  tehsil?: { name: string };
  score: number;
  mutualFriends: number;
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadAll();
  }, [status]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fRes, rRes, sRes] = await Promise.all([
        fetch("/api/friends").then((r) => r.json()),
        fetch("/api/friends/requests").then((r) => r.json()),
        fetch("/api/friends/suggestions").then((r) => r.json()),
      ]);
      setFriends(fRes.friends || []);
      setRequests(rRes.requests || []);
      setSuggestions(sRes.suggestions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/friends/${id}/accept`, { method: "POST" });
    loadAll();
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/friends/${id}/reject`, { method: "POST" });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setActionLoading(null);
  };

  const handleAddFriend = async (memberId: string) => {
    setActionLoading(memberId);
    await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== memberId));
    setActionLoading(null);
  };

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: "friends", label: "Friends", icon: Users, count: friends.length },
    { id: "requests", label: "Requests", icon: UserPlus, count: requests.length },
    { id: "suggestions", label: "Discover", icon: Star, count: suggestions.length },
  ];

  if (loading) {
    return (
      <div className="px-4 pt-3 pb-20 space-y-3">
        <div className="h-8 w-32 bg-surface-tertiary rounded animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 w-24 bg-surface-tertiary rounded-full animate-pulse" />)}
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-tertiary rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-20">
      <h1 className="text-title tracking-tight mb-4">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-caption font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? "bg-accent text-white" : "bg-surface-tertiary text-label-secondary"
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                tab === t.id ? "bg-white/20" : "bg-surface-primary"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {tab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="mx-auto text-label-quaternary mb-3" />
              <p className="text-body text-label-tertiary">No friends yet</p>
              <p className="text-caption text-label-quaternary mt-1">Check out suggestions to connect with members!</p>
            </div>
          ) : (
            friends.map((f) => (
              <Link key={f.friendshipId} href={`/profile/${f.id}`} className="card !p-3 flex items-center gap-3 tap-scale">
                <Avatar src={f.photoUrl} name={f.name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-label-primary truncate">{f.name}</p>
                  <div className="flex items-center gap-2 text-caption text-label-tertiary">
                    {f.district && <span className="flex items-center gap-0.5"><MapPin size={10} />{f.district.name}</span>}
                    <span className="flex items-center gap-0.5"><Star size={10} />{f.score} pts</span>
                  </div>
                </div>
                <UserCheck size={18} className="text-accent" />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Requests */}
      {tab === "requests" && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus size={40} className="mx-auto text-label-quaternary mb-3" />
              <p className="text-body text-label-tertiary">No pending requests</p>
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="card !p-3 flex items-center gap-3">
                <Link href={`/profile/${r.requester.id}`}>
                  <Avatar src={r.requester.photoUrl} name={r.requester.name} size={44} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-label-primary truncate">{r.requester.name}</p>
                  <div className="flex items-center gap-2 text-caption text-label-tertiary">
                    {r.requester.district && <span className="flex items-center gap-0.5"><MapPin size={10} />{r.requester.district.name}</span>}
                    <span>{r.requester.score} pts</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.id)}
                    disabled={actionLoading === r.id}
                    className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white tap-scale disabled:opacity-40"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={actionLoading === r.id}
                    className="w-9 h-9 rounded-full bg-surface-tertiary flex items-center justify-center text-label-tertiary tap-scale disabled:opacity-40"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suggestions */}
      {tab === "suggestions" && (
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <div className="text-center py-16">
              <Star size={40} className="mx-auto text-label-quaternary mb-3" />
              <p className="text-body text-label-tertiary">No suggestions right now</p>
            </div>
          ) : (
            suggestions.map((s) => (
              <div key={s.id} className="card !p-3 flex items-center gap-3">
                <Link href={`/profile/${s.id}`}>
                  <Avatar src={s.photoUrl} name={s.name} size={44} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-label-primary truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-caption text-label-tertiary">
                    {s.district && <span className="flex items-center gap-0.5"><MapPin size={10} />{s.district.name}</span>}
                    {s.mutualFriends > 0 && <span>{s.mutualFriends} mutual</span>}
                    <span>{s.score} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFriend(s.id)}
                  disabled={actionLoading === s.id}
                  className="bg-accent text-white rounded-full px-3 py-1.5 text-caption font-semibold tap-scale disabled:opacity-40 flex items-center gap-1"
                >
                  <UserPlus size={12} /> Add
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
