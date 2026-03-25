"use client";

import { QRCodeSVG } from "qrcode.react";
import { MapPin, Hash, Calendar, Share2, Download } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

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
  showShareButton?: boolean;
}

export default function MembershipCard({
  name, membershipNumber, partyName, constituencyCode, constituencyName,
  referralCode, photoUrl, rank, score, joinDate, location, showShareButton = true,
}: MembershipCardProps) {
  const joinDateObj = new Date(joinDate);
  const joiningYear = joinDateObj.getFullYear();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrintCard = async () => {
    if (!cardRef.current || printing) return;
    setPrinting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1C1C1E",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Membership Card - ${membershipNumber}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
              .card-img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
              @media print { body { background: white; padding: 0; } .card-img { box-shadow: none; } }
            </style>
          </head>
          <body>
            <img src="${imgData}" class="card-img" alt="Membership Card" />
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      }
    } catch (err) {
      console.error("Print failed:", err);
    } finally {
      setPrinting(false);
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
      });
      const file = new File([blob], "membership-card.png", { type: "image/png" });
      const shareText = `Join Pakistan Awaam Raaj Tehreek! Use my referral code: ${referralCode}`;
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Membership Card", text: shareText });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "membership-card.png";
        link.click();
        URL.revokeObjectURL(link.href);
        window.open(shareUrl, "_blank");
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="relative">
      <div ref={cardRef} className="relative rounded-apple-xl overflow-hidden shadow-apple-lg" style={{ aspectRatio: "1.7/1" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] via-[#2C2C2E] to-[#1C1C1E]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(220,38,38,0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(212,168,67,0.2) 0%, transparent 40%)`,
        }} />

        <div className="relative h-full flex flex-col justify-between p-5">
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
              <QRCodeSVG value={`https://partyapp-jet.vercel.app/register?ref=${referralCode}`} size={48} level="M" />
            </div>
          </div>

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
      {showShareButton && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={handlePrintCard}
            disabled={printing}
            className="bg-white/10 hover:bg-white/20 disabled:bg-white/10 backdrop-blur-sm rounded-full p-2.5 transition-all tap-scale"
            title="Print Card"
          >
            <Download size={18} className="text-white" />
          </button>
          <button
            onClick={handleShareCard}
            disabled={sharing}
            className="bg-white/10 hover:bg-white/20 disabled:bg-white/10 backdrop-blur-sm rounded-full p-2.5 transition-all tap-scale"
            title="Share Card"
          >
            <Share2 size={18} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}