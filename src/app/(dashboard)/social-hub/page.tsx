"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Link2, Unlink, Plus, ExternalLink, CheckCircle, Clock, XCircle,
  Hash, Send, Image, Trophy, Facebook, Twitter, Instagram, Youtube
} from "lucide-react";

const PLATFORMS = [
  { key: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-500", placeholder: "facebook.com/yourpage" },
  { key: "TWITTER", label: "Twitter / X", icon: Twitter, color: "text-sky-500", placeholder: "@handle" },
  { key: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500", placeholder: "@handle" },
  { key: "TIKTOK", label: "TikTok", icon: Hash, color: "text-label-primary", placeholder: "@handle" },
  { key: "YOUTUBE", label: "YouTube", icon: Youtube, color: "text-red-500", placeholder: "youtube.com/@channel" },
];

const PARTY_HASHTAGS = ["#PakistanAwaamRaaj", "#عوام_راج", "#PART"];

interface MemberSocial {
  id: string;
  platform: string;
  handle: string;
  profileUrl: string | null;
  verified: boolean;
}

interface HashtagSubmission {
  id: string;
  platform: string;
  postUrl: string;
  hashtag: string;
  status: string;
  pointsAwarded: number;
  createdAt: string;
}

export default function SocialHubPage() {
  const { data: session } = useSession();
  const [socials, setSocials] = useState<MemberSocial[]>([]);
  const [submissions, setSubmissions] = useState<HashtagSubmission[]>([]);
  const [tab, setTab] = useState<"accounts" | "submissions">("accounts");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Link form state
  const [linkPlatform, setLinkPlatform] = useState("FACEBOOK");
  const [linkHandle, setLinkHandle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Submit form state
  const [subPlatform, setSubPlatform] = useState("FACEBOOK");
  const [subPostUrl, setSubPostUrl] = useState("");
  const [subHashtag, setSubHashtag] = useState(PARTY_HASHTAGS[0]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    const [socialsRes, hashtagsRes] = await Promise.all([
      fetch("/api/socials"),
      fetch("/api/hashtags"),
    ]);
    if (socialsRes.ok) setSocials(await socialsRes.json());
    if (hashtagsRes.ok) {
      const data = await hashtagsRes.json();
      setSubmissions(data.submissions);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const linkAccount = async () => {
    setError(""); setSuccess("");
    if (!linkHandle.trim()) { setError("Handle is required"); return; }
    const res = await fetch("/api/socials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: linkPlatform, handle: linkHandle.trim(), profileUrl: linkUrl.trim() || null }),
    });
    if (res.ok) {
      setSuccess("Account linked!");
      setShowLinkForm(false);
      setLinkHandle(""); setLinkUrl("");
      await fetchData();
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const unlinkAccount = async (platform: string) => {
    if (!confirm("Unlink this account?")) return;
    await fetch(`/api/socials?platform=${platform}`, { method: "DELETE" });
    await fetchData();
  };

  const submitHashtag = async () => {
    setError(""); setSuccess("");
    if (!subPostUrl.trim()) { setError("Post URL is required"); return; }
    const res = await fetch("/api/hashtags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: subPlatform, postUrl: subPostUrl.trim(), hashtag: subHashtag }),
    });
    if (res.ok) {
      setSuccess("Submitted for review! You'll earn points once approved.");
      setShowSubmitForm(false);
      setSubPostUrl("");
      await fetchData();
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const totalPoints = submissions.filter(s => s.status === "APPROVED").reduce((a, s) => a + s.pointsAwarded, 0);

  if (loading) return <div className="p-6 text-center text-label-secondary">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Points Banner */}
      <div className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <Trophy size={24} className="text-accent" />
        </div>
        <div>
          <div className="text-2xl font-bold text-accent">{totalPoints}</div>
          <div className="text-xs text-label-tertiary">Social Media Points</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-bold text-label-primary">{submissions.filter(s => s.status === "APPROVED").length}</div>
          <div className="text-xs text-label-tertiary">Approved Posts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-primary rounded-xl p-1">
        <button
          onClick={() => setTab("accounts")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "accounts" ? "bg-accent text-white" : "text-label-secondary"}`}
        >
          Linked Accounts
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "submissions" ? "bg-accent text-white" : "text-label-secondary"}`}
        >
          Hashtag Posts
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-500 text-sm">{success}</div>}

      {/* ─── Linked Accounts Tab ─── */}
      {tab === "accounts" && (
        <div className="space-y-3">
          {PLATFORMS.map((p) => {
            const linked = socials.find((s) => s.platform === p.key);
            return (
              <div key={p.key} className="bg-surface-primary rounded-xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center ${p.color}`}>
                  <p.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-label-primary">{p.label}</div>
                  {linked ? (
                    <div className="text-xs text-label-secondary truncate">{linked.handle}</div>
                  ) : (
                    <div className="text-xs text-label-tertiary">Not linked</div>
                  )}
                </div>
                {linked ? (
                  <button
                    onClick={() => unlinkAccount(p.key)}
                    className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"
                  >
                    <Unlink size={14} className="text-red-500" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setLinkPlatform(p.key); setShowLinkForm(true); }}
                    className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center"
                  >
                    <Plus size={14} className="text-accent" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Hashtag Submissions Tab ─── */}
      {tab === "submissions" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSubmitForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium tap-scale"
          >
            <Send size={16} /> Submit a Hashtag Post
          </button>

          <div className="bg-surface-primary rounded-xl p-3">
            <div className="text-xs text-label-tertiary mb-2">Use these hashtags in your posts:</div>
            <div className="flex flex-wrap gap-2">
              {PARTY_HASHTAGS.map((h) => (
                <span key={h} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">{h}</span>
              ))}
            </div>
            <div className="text-xs text-label-tertiary mt-2">+5 points per approved post (max 5/day)</div>
          </div>

          {submissions.length === 0 ? (
            <div className="bg-surface-primary rounded-xl p-6 text-center text-label-tertiary text-sm">
              No submissions yet. Post with our hashtags and submit the link!
            </div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="bg-surface-primary rounded-xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s.status === "APPROVED" ? "bg-green-500/10" : s.status === "REJECTED" ? "bg-red-500/10" : "bg-yellow-500/10"
                }`}>
                  {s.status === "APPROVED" ? <CheckCircle size={18} className="text-green-500" /> :
                   s.status === "REJECTED" ? <XCircle size={18} className="text-red-500" /> :
                   <Clock size={18} className="text-yellow-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-label-primary">{s.hashtag}</span>
                    <span className="text-xs text-label-tertiary">{s.platform.toLowerCase()}</span>
                  </div>
                  <div className="text-xs text-label-tertiary truncate">{s.postUrl}</div>
                  <div className="text-xs text-label-tertiary">{new Date(s.createdAt).toLocaleDateString()}</div>
                </div>
                {s.pointsAwarded > 0 && (
                  <span className="text-accent text-sm font-bold">+{s.pointsAwarded}</span>
                )}
                <a href={s.postUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center">
                  <ExternalLink size={14} className="text-label-tertiary" />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Link Account Modal ─── */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowLinkForm(false)}>
          <div className="bg-surface-primary w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-label-primary">
              Link {PLATFORMS.find(p => p.key === linkPlatform)?.label}
            </h3>
            <input
              type="text"
              value={linkHandle}
              onChange={(e) => setLinkHandle(e.target.value)}
              placeholder={PLATFORMS.find(p => p.key === linkPlatform)?.placeholder}
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary text-label-primary text-sm border border-separator/50 focus:border-accent outline-none"
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Profile URL (optional)"
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary text-label-primary text-sm border border-separator/50 focus:border-accent outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowLinkForm(false)} className="flex-1 py-3 rounded-xl bg-surface-secondary text-label-secondary text-sm font-medium">Cancel</button>
              <button onClick={linkAccount} className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-medium">Link Account</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Submit Hashtag Modal ─── */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowSubmitForm(false)}>
          <div className="bg-surface-primary w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-label-primary">Submit Hashtag Post</h3>
            <select
              value={subPlatform}
              onChange={(e) => setSubPlatform(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary text-label-primary text-sm border border-separator/50"
            >
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <select
              value={subHashtag}
              onChange={(e) => setSubHashtag(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary text-label-primary text-sm border border-separator/50"
            >
              {PARTY_HASHTAGS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <input
              type="url"
              value={subPostUrl}
              onChange={(e) => setSubPostUrl(e.target.value)}
              placeholder="Paste your post URL here"
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary text-label-primary text-sm border border-separator/50 focus:border-accent outline-none"
            />
            <div className="text-xs text-label-tertiary">Paste the direct link to your social media post containing the hashtag.</div>
            <div className="flex gap-2">
              <button onClick={() => setShowSubmitForm(false)} className="flex-1 py-3 rounded-xl bg-surface-secondary text-label-secondary text-sm font-medium">Cancel</button>
              <button onClick={submitHashtag} className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-medium">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
