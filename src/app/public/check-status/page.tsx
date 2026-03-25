"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, CheckCircle, XCircle, ChevronRight, Award } from "lucide-react";

interface MemberStatus {
  found: boolean;
  member?: {
    name: string;
    nameUrdu?: string;
    phone: string;
    membershipNumber: string | null;
    status: string;
    role: string;
    score: number;
    rank: number | null;
    referralCode: string;
    party: { name: string; logoUrl?: string };
    province: string | null;
    district: string | null;
    tehsil: string | null;
    constituency: string | null;
    referralCount: number;
    memberSince: string;
    isVerified: boolean;
  };
  message?: string;
}

export default function PublicStatusPage() {
  const [cnic, setCnic] = useState("");
  const [status, setStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnic.trim()) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch(`/api/public/member-status?cnic=${encodeURIComponent(cnic)}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError("Failed to lookup CNIC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCnic = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnic(e.target.value);
    setCnic(formatted);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-accent text-white px-6 py-8 rounded-b-3xl">
        <h1 className="text-title-lg font-bold">Check Membership Status</h1>
        <p className="text-body mt-2 opacity-90">Enter your CNIC to check your party membership status</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* CNIC Input */}
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="text-subhead font-semibold text-label-primary block mb-2">
              Enter CNIC
            </label>
            <div className="relative">
              <input
                type="text"
                value={cnic}
                onChange={handleCnicChange}
                placeholder="12345-1234567-1"
                className="w-full px-4 py-4 bg-white border-2 border-surface-tertiary rounded-apple-xl text-headline focus:border-accent focus:outline-none transition-colors"
                maxLength={15}
                inputMode="numeric"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-label-tertiary" size={20} />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || cnic.replace(/-/g, "").length < 13}
            className="w-full bg-accent text-white py-4 rounded-apple-xl font-semibold text-body disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Checking...</span>
            ) : (
              <>
                Check Status
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-apple-xl p-4 flex items-center gap-3">
            <XCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-red-700 text-body">{error}</p>
          </div>
        )}

        {/* Not Found */}
        {status && !status.found && (
          <div className="bg-surface-secondary rounded-apple-xl p-6 text-center space-y-4">
            <XCircle className="mx-auto text-label-tertiary" size={48} />
            <div>
              <h3 className="text-headline font-semibold text-label-primary">Member Not Found</h3>
              <p className="text-body text-label-tertiary mt-1">{status.message}</p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-apple-lg font-semibold"
            >
              Register Now
            </Link>
          </div>
        )}

        {/* Found Status */}
        {status && status.found && status.member && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-apple-xl p-6 shadow-sm border border-surface-tertiary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-headline font-semibold text-label-primary">Membership Details</h3>
                <span className={`px-3 py-1 rounded-full text-caption font-semibold ${
                  status.member.status === "ACTIVE" 
                    ? "bg-green-100 text-green-700" 
                    : status.member.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {status.member.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Name</span>
                  <span className="text-body font-semibold text-label-primary">{status.member.name}</span>
                </div>
                {status.member.nameUrdu && (
                  <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                    <span className="text-body text-label-tertiary">Name (Urdu)</span>
                    <span className="text-body font-semibold text-label-primary" dir="rtl">{status.member.nameUrdu}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Membership #</span>
                  <span className="text-body font-semibold text-label-primary">
                    {status.member.membershipNumber || "Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">CNIC</span>
                  <span className="text-body font-semibold text-label-primary">{cnic}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Phone</span>
                  <span className="text-body font-semibold text-label-primary">{status.member.phone}</span>
                </div>
                {status.member.district && (
                  <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                    <span className="text-body text-label-tertiary">District</span>
                    <span className="text-body font-semibold text-label-primary">{status.member.district}</span>
                  </div>
                )}
                {status.member.province && (
                  <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                    <span className="text-body text-label-tertiary">Province</span>
                    <span className="text-body font-semibold text-label-primary">{status.member.province}</span>
                  </div>
                )}
                {status.member.constituency && (
                  <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                    <span className="text-body text-label-tertiary">Constituency</span>
                    <span className="text-body font-semibold text-label-primary">{status.member.constituency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Score</span>
                  <span className="text-body font-semibold text-accent">{status.member.score}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Rank</span>
                  <span className="text-body font-semibold text-accent">#{status.member.rank || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-tertiary">
                  <span className="text-body text-label-tertiary">Referrals</span>
                  <span className="text-body font-semibold text-label-primary">{status.member.referralCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-body text-label-tertiary">Member Since</span>
                  <span className="text-body font-semibold text-label-primary">
                    {new Date(status.member.memberSince).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-accent-50 border border-accent/20 rounded-apple-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Award className="text-accent" size={24} />
                <h3 className="text-headline font-semibold text-accent">Your Referral Code</h3>
              </div>
              <p className="text-title-md font-bold text-accent tracking-wider">{status.member.referralCode}</p>
              <p className="text-caption text-label-tertiary mt-2">Share this code with others to earn points!</p>
            </div>

            {/* CTA */}
            {status.member.status !== "ACTIVE" && (
              <Link
                href="/login"
                className="block w-full bg-accent text-white py-4 rounded-apple-xl font-semibold text-body text-center"
              >
                Login to Complete Registration
              </Link>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-surface-secondary rounded-apple-xl p-4">
          <h4 className="text-subhead font-semibold text-label-primary mb-2">How to Check Status</h4>
          <ul className="text-body text-label-secondary space-y-1">
            <li>1. Enter your 13-digit CNIC number</li>
            <li>2. Click &quot;Check Status&quot;</li>
            <li>3. View your membership details</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="flex gap-3">
          <Link
            href="/public/leaderboard"
            className="flex-1 bg-white border border-surface-tertiary rounded-apple-xl p-4 flex items-center justify-center gap-2"
          >
            <Users size={20} className="text-accent" />
            <span className="text-body font-semibold text-label-primary">View Leaderboard</span>
          </Link>
          <Link
            href="/register"
            className="flex-1 bg-white border border-surface-tertiary rounded-apple-xl p-4 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} className="text-accent" />
            <span className="text-body font-semibold text-label-primary">Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}