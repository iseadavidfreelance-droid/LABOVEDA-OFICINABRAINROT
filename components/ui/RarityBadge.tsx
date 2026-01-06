import React from "react";
import { RarityTier } from "../../types/database";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface RarityBadgeProps {
  tier: RarityTier;
  className?: string;
}

const RarityBadge: React.FC<RarityBadgeProps> = ({ tier, className }) => {
  // Casting motion.div to any to avoid TypeScript errors with motion props
  const MotionDiv = motion.div as any;

  const getStyles = (tier: RarityTier) => {
    switch (tier) {
      case "DUST":
        return "text-rank-dust border-rank-dust/30 bg-transparent opacity-60";
      case "COMMON":
        return "text-rank-common border-rank-common/50 bg-rank-common/5";
      case "UNCOMMON":
        return "text-rank-uncommon border-rank-uncommon/60 bg-rank-uncommon/10 shadow-[0_0_8px_-2px_rgba(0,209,255,0.3)]";
      case "RARE":
        return "text-rank-rare border-rank-rare/70 bg-rank-rare/10 shadow-[0_0_12px_-2px_rgba(188,19,254,0.4)]";
      case "LEGENDARY":
        return "text-rank-legendary border-rank-legendary bg-rank-legendary/20 shadow-[0_0_15px_rgba(255,215,0,0.5)] animate-pulse-slow";
      default:
        return "text-gray-500 border-gray-800";
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1",
        "font-sans text-xs font-bold tracking-widest uppercase",
        "border backdrop-blur-sm select-none",
        getStyles(tier),
        className
      )}
    >
      {tier}
      {tier === "LEGENDARY" && (
        <span className="ml-2 w-1.5 h-1.5 rounded-full bg-rank-legendary animate-ping" />
      )}
    </MotionDiv>
  );
};

export default RarityBadge;