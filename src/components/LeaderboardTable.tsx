"use client";

interface LeaderboardEntry {
  rank?: number;
  score: number;
  directReferrals?: number;
  isCandidate?: boolean;
  member?: { id: string; name: string; referralCode: string };
  id?: string;
  name?: string;
  referralCode?: string;
  constituency?: { code: string; name: string };
}

export default function LeaderboardTable({ entries, isNational }: { entries: LeaderboardEntry[]; isNational?: boolean }) {
  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const rank = entry.rank || index + 1;
        const name = isNational ? entry.name : entry.member?.name;
        const score = entry.score;
        const isTop3 = rank <= 3;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

        return (
          <div key={index} className={`card flex items-center gap-3 ${entry.isCandidate ? "border-2 border-party-red" : ""}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isTop3 ? "bg-party-red/10 text-party-red" : "bg-gray-100 text-gray-600"
            }`}>
              {medal || rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{name || "—"}</p>
                {entry.isCandidate && (
                  <span className="text-[10px] bg-party-red text-white px-1.5 py-0.5 rounded-full flex-shrink-0">Candidate</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isNational && entry.constituency ? entry.constituency.code : ""}
                {entry.directReferrals !== undefined ? ` • ${entry.directReferrals} direct` : ""}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-party-red">{score}</p>
              <p className="text-[10px] text-gray-400">pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
