"use client";

import { Award, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank?: number;
  score: number;
  directReferrals?: number;
  isCandidate?: boolean;
  member?: { id: string; name: string; referralCode: string };
  id?: string;
  name?: string;
  district?: { name: string; province?: { name: string } };
}

export default function LeaderboardTable({ entries, isNational }: { entries: LeaderboardEntry[]; isNational?: boolean }) {
  return (
    <div className="card-grouped">
      {entries.map((entry, index) => {
        const rank = entry.rank || index + 1;
        const name = isNational ? entry.name : entry.member?.name;
        const score = entry.score;
        const isTop3 = rank <= 3;

        return (
          <div key={index} className={`list-row ${entry.isCandidate ? "bg-accent-50" : ""}`}>
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-subhead font-semibold flex-shrink-0 ${
              rank === 1 ? "bg-amber-100 text-amber-700" :
              rank === 2 ? "bg-gray-100 text-gray-600" :
              rank === 3 ? "bg-orange-50 text-orange-600" :
              "bg-surface-tertiary text-label-tertiary"
            }`}>
              {rank}
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body font-medium truncate text-label-primary">{name || "—"}</p>
                {entry.isCandidate && (
                  <span className="badge badge-red flex items-center gap-1">
                    <Award size={10} />
                    <span>Candidate</span>
                  </span>
                )}
              </div>
              {isNational && entry.district && (
                <p className="text-caption text-label-tertiary mt-0.5">
                  {entry.district.name}{entry.district.province ? `, ${entry.district.province.name}` : ""}
                </p>
              )}
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <p className="text-headline text-label-primary">{score}</p>
              <p className="text-caption text-label-tertiary">points</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
