import React from "react";
import { cn } from "../../lib/utils";

type StatusType = "standby" | "processing" | "alert";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string; // Optional label next to the dot
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const getDotStyles = (s: StatusType) => {
    switch (s) {
      case "standby":
        return "bg-tech-green shadow-[0_0_5px_#00FF41]";
      case "processing":
        return "bg-blue-500 animate-pulse shadow-[0_0_5px_#3B82F6]";
      case "alert":
        return "bg-red-600 animate-ping shadow-[0_0_8px_#DC2626]";
      default:
        return "bg-gray-500";
    }
  };

  const getLabelColor = (s: StatusType) => {
    switch (s) {
        case "standby": return "text-tech-green";
        case "processing": return "text-blue-500";
        case "alert": return "text-red-600";
        default: return "text-gray-500";
    }
  }

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <div className="relative flex items-center justify-center w-3 h-3">
        {/* Outer Glow/Ring for Alert/Processing */}
        {status === "alert" && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", getDotStyles(status))} />
      </div>
      
      {label && (
        <span className={cn("uppercase tracking-wider", getLabelColor(status))}>
            {label}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;