import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      partyId: string;
      constituencyId: string | null;
      referralCode: string;
      phone: string;
    } & DefaultSession["user"];
  }
}

export interface MemberProfile {
  id: string;
  name: string;
  nameUrdu?: string;
  email?: string;
  phone: string;
  cnic: string;
  age?: number;
  gender?: string;
  photoUrl?: string;
  referralCode: string;
  membershipNumber?: string;
  score: number;
  rank?: number;
  status: string;
  role: string;
  party: { name: string; logoUrl?: string };
  constituency?: { code: string; name: string; type: string };
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  score: number;
  directReferrals: number;
  level2Referrals: number;
  level3Referrals: number;
  activeBonus: number;
  isCandidate: boolean;
  member: {
    id: string;
    name: string;
    photoUrl?: string;
    referralCode: string;
  };
  constituency: {
    code: string;
    name: string;
    type: string;
  };
}

export interface ReferralStats {
  directCount: number;
  level2Count: number;
  level3Count: number;
  activeCount: number;
  totalScore: number;
  referrals: {
    id: string;
    name: string;
    status: string;
    joinedAt: string;
    level: number;
  }[];
}
