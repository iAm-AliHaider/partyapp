"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, MapPin, ChevronLeft, RefreshCw } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  nameUrdu?: string;
  photoUrl?: string;
  score: number;
  membershipNumber: string | null;
  referralCount: number;
  province?: string;
  district?: string;
}

interface LeaderboardData {
  type: string;
  leaderboard: LeaderboardEntry[];
  provinceId?: string;
  districtId?: string;
  constituencyCode?: string;
}

export default function PublicLeaderboardPage() {
  const searchParams = useSearchParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"national" | "province" | "district" | "constituency">(
    (searchParams.get("type") as any) || "national"
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/public/leaderboard?type=${filter}`;
      if (filter === "national") {
        // no extra params
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (filter) {
      case "national": return "National Rankings";
      case "province": return "Province Rankings";
      case "district": return "District Rankings";
      case "constituency": return "Constituency Rankings";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-accent text-white px-6 py-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/public/check-status" className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-title-lg font-bold">Leaderboard</h1>
        </div>
        <p className="text-body opacity-90">Top party members by score</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["national", "province", "district", "constituency"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-body font-semibold whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-accent text-white"
                  : "bg-white border border-surface-tertiary text-label-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="flex items-center gap-2 text-accent text-body font-semibold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-apple-xl p-4">
            <p className="text-red-700 text-body">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-apple-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-tertiary" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-tertiary rounded w-1/3 mb-2" />
                    <div className="h-3 bg-surface-tertiary rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-surface-tertiary rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!loading && leaderboard && (
          <div className="space-y-3">
            <p className="text-subhead font-semibold text-label-secondary">{getFilterLabel()}</p>
            
            {leaderboard.leaderboard.length === 0 ? (
              <div className="bg-white rounded-apple-xl p-8 text-center">
                <Award className="mx-auto text-label-tertiary mb-3" size={48} />
                <p className="text-body text-label-tertiary">No ranked members yet</p>
              </div>
            ) : (
              leaderboard.leaderboard.map((entry, index) => (
                <div
                  key={entry.rank || index}
                  className={`bg-white rounded-apple-xl p-4 border-2 ${
                    index === 0 ? "border-yellow-400" :
                    index === 1 ? "border-gray-300" :
                    index === 2 ? "border-amber-400" :
                    "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-600" :
                      index === 2 ? "bg-amber-100 text-amber-700" :
                      "bg-surface-tertiary text-label-secondary"
                    }`}>
                      {index + 1}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-label-primary truncate">
                        {entry.name}
                        {entry.nameUrdu && (
                          <span className="text-label-tertiary text-caption ml-1" dir="rtl">
                            ({entry.nameUrdu})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-caption text-label-tertiary">
                        {entry.district && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {entry.district}
                          </span>
                        )}
                        {entry.province && (
                          <span>{entry.province}</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="text-headline font-bold text-accent">{entry.score}</p>
                      <p className="text-caption text-label-tertiary">points</p>
                    </div>
                  </div>

                  {/* Top 3 Special Badge */}
                  {index < 3 && (
                    <div className="mt-3 pt-3 border-t border-surface-tertiary flex items-center gap-2">
                      <Award size={16} className={
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-500" :
                        "text-amber-500"
                      } />
                      <span className="text-caption font-semibold text-label-secondary">
                        {index === 0 ? "1st Place" : index === 1 ? "2nd Place" : "3rd Place"} - {entry.referralCount} referrals
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-accent-50 border border-accent/20 rounded-apple-xl p-6 text-center">
          <p className="text-body text-label-primary mb-3">Want to appear on the leaderboard?</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-apple-lg font-semibold"
          >
            Join the Party
          </Link>
        </div>
      </div>
    </div>
  );
}