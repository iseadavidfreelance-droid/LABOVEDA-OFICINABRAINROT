import React, { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface TechInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

const TechInput: React.FC<TechInputProps> = ({ label, error, className, ...props }) => {
  // Casting motion.div to any to avoid TypeScript errors with motion props
  const MotionDiv = motion.div as any;

  return (
    <div className="w-full space-y-1 group">
      {label && (
        <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 group-focus-within:text-tech-green transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "w-full bg-void-black font-mono text-sm text-[#E5E5E5] placeholder-gray-700",
            "py-2 px-1 rounded-none outline-none",
            "border-b-2 border-void-border transition-colors duration-300",
            "focus:border-tech-green focus:bg-void-gray/10",
            error ? "border-red-600 text-red-500 focus:border-red-500" : "",
            className
          )}
          autoComplete="off"
          spellCheck={false}
          {...props}
        />
        
        {/* Animated Scanline effect on Focus (Optional detail) */}
        <MotionDiv 
          className="absolute bottom-0 left-0 h-[2px] bg-tech-green"
          initial={{ width: "0%" }}
          whileInView={{ width: "0%" }} // Reset
          animate={{ width: "0%" }} 
          // Logic could be expanded to animate width on focus if controlled, 
          // but CSS focus:border handles the main visual requirement.
        />
      </div>
    </div>
  );
};

export default TechInput;