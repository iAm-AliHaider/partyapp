"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

interface MembershipCardProps {
  name: string;
  membershipNumber: string;
  partyName: string;
  constituencyCode?: string;
  constituencyName?: string;
  referralCode: string;
  photoUrl?: string;
  rank?: number;
  score: number;
  joinDate: string;
  location?: string;
}

export default function MembershipCard({
  name,
  membershipNumber,
  partyName,
  constituencyCode,
  constituencyName,
  referralCode,
  photoUrl,
  rank,
  score,
  joinDate,
  location,
}: MembershipCardProps) {
  // Format joining date
  const joinDateObj = new Date(joinDate);
  const joiningMonth = joinDateObj.toLocaleString("en-US", { month: "long" });
  const joiningYear = joinDateObj.getFullYear();

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-sm mx-auto" style={{ aspectRatio: "3/4.2" }}>
      {/* Red textured background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#C41E1E] via-[#B91C1C] to-[#991B1B]" />
      {/* Subtle fabric texture overlay */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zM3 3h1v1H3z' fill='%23000' fill-opacity='.15'/%3E%3C/svg%3E")`,
        backgroundSize: "6px 6px",
      }} />

      <div className="relative h-full flex flex-col p-0">
        {/* ═══ TOP: Gold bar + AWAAM RAAJ header ═══ */}
        <div className="relative">
          {/* Top gold border */}
          <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />

          <div className="flex items-center gap-3 px-5 py-3">
            <Image src="/icons/party-logo.png" alt="Party Flag" width={48} height={48} className="drop-shadow-lg" />
            <h1 className="text-2xl font-extrabold text-white tracking-wide" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}>
              AWAAM RAAJ
            </h1>
          </div>

          {/* Gold decorative bar */}
          <div className="h-1.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-4" />
        </div>

        {/* ═══ MIDDLE: Photo + Name + QR ═══ */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 flex-1">
          {/* Photo with gold border */}
          <div className="shrink-0">
            <div className="w-28 h-32 rounded-lg overflow-hidden border-[3px] border-[#DAA520] shadow-lg bg-white/10">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-b from-white/20 to-white/5">
                  👤
                </div>
              )}
            </div>
          </div>

          {/* Name + QR */}
          <div className="flex-1 flex flex-col items-center justify-between h-32">
            <h2 className="text-lg font-bold text-white text-center leading-tight mt-2" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}>
              {name.toUpperCase()}
            </h2>
            {/* QR Code */}
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <QRCodeSVG value={`https://awaamraaj.pk/join/${referralCode}`} size={64} level="M" />
            </div>
          </div>
        </div>

        {/* ═══ GOLD WAVE DIVIDER ═══ */}
        <div className="relative h-6 mx-0">
          <svg viewBox="0 0 400 24" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8860B" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFF8DC" />
                <stop offset="70%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path d="M0,12 Q100,0 200,12 T400,12" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />
            <path d="M0,16 Q100,4 200,16 T400,16" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.5" />
          </svg>
        </div>

        {/* ═══ BOTTOM: Location + Details ═══ */}
        <div className="px-5 pb-5 space-y-2">
          {/* Location / Constituency */}
          <h3 className="text-base font-bold text-white tracking-wide" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.4)" }}>
            {location || constituencyName || constituencyCode || "PAKISTAN"}
          </h3>

          {/* Membership ID */}
          <div>
            <span className="text-xs font-bold text-[#FFD700]">Membership ID: </span>
            <span className="text-xs font-semibold text-white">{membershipNumber}</span>
          </div>

          {/* Joining Date */}
          <div>
            <span className="text-xs font-bold text-[#FFD700]">Joining Year: </span>
            <span className="text-xs font-semibold text-white">{joiningMonth} {joiningYear}</span>
          </div>

          {/* Constituency */}
          {constituencyCode && (
            <div>
              <span className="text-xs font-bold text-[#FFD700]">Constituency: </span>
              <span className="text-xs font-semibold text-white">{constituencyCode}</span>
            </div>
          )}

          {/* Score & Rank row */}
          <div className="flex gap-4 pt-1">
            {rank && (
              <div>
                <span className="text-xs font-bold text-[#FFD700]">Rank: </span>
                <span className="text-xs font-semibold text-white">#{rank}</span>
              </div>
            )}
            {score > 0 && (
              <div>
                <span className="text-xs font-bold text-[#FFD700]">Score: </span>
                <span className="text-xs font-semibold text-white">{score} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom gold border */}
        <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />
      </div>
    </div>
  );
}
