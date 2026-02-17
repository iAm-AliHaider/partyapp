"use client";

import { QRCodeSVG } from "qrcode.react";
import { MapPin, Star, Hash, Calendar } from "lucide-react";

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
  name, membershipNumber, partyName, constituencyCode, constituencyName,
  referralCode, photoUrl, rank, score, joinDate, location,
}: MembershipCardProps) {
  const joinDateObj = new Date(joinDate);
  const joiningYear = joinDateObj.getFullYear();

  return (
    <div className="relative rounded-apple-xl overflow-hidden shadow-apple-lg" style={{ aspectRatio: "1.7/1" }}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] via-[#2C2C2E] to-[#1C1C1E]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(220,38,38,0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(212,168,67,0.2) 0%, transparent 40%)`,
      }} />

      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Top: Party name + QR */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/40 text-caption font-medium tracking-widest uppercase">
              {partyName}
            </p>
            <h2 className="text-white text-title-sm mt-0.5 tracking-tight">
              {name}
            </h2>
          </div>
          <div className="bg-white rounded-apple p-1.5">
            <QRCodeSVG value={`https://awaamraaj.pk/join/${referralCode}`} size={48} level="M" />
          </div>
        </div>

        {/* Bottom: Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-white/40" />
                <span className="text-white/60 text-caption">{location}</span>
              </div>
            )}
            {constituencyCode && (
              <div className="flex items-center gap-1.5">
                <Hash size={12} className="text-white/40" />
                <span className="text-white/60 text-caption">{constituencyCode}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-white/40 text-caption">ID</p>
                <p className="text-white text-subhead font-medium font-mono">{membershipNumber}</p>
              </div>
              {rank && (
                <div>
                  <p className="text-white/40 text-caption">Rank</p>
                  <p className="text-white text-subhead font-medium">#{rank}</p>
                </div>
              )}
              {score > 0 && (
                <div>
                  <p className="text-white/40 text-caption">Score</p>
                  <p className="text-white text-subhead font-medium">{score}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-white/30">
              <Calendar size={11} />
              <span className="text-caption">{joiningYear}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
