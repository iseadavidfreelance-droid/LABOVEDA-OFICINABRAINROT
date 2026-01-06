
import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface TechButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: "primary" | "danger" | "ghost";
  icon?: LucideIcon;
  label?: string;
}

const TechButton: React.FC<TechButtonProps> = ({
  variant = "primary",
  icon: Icon,
  label,
  className,
  onClick,
  ...props
}) => {
  // Casting motion.button to any to avoid TypeScript errors with motion props
  const MotionButton = motion.button as any;

  const baseStyles = "relative font-sans text-sm font-semibold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-2 px-6 py-2 border select-none disabled:opacity-50 disabled:cursor-not-allowed outline-none";

  const variants = {
    primary: "border-void-border bg-void-gray/40 text-gray-300 hover:bg-void-gray hover:text-white hover:border-gray-500",
    danger: "border-red-900/50 text-red-500 bg-red-950/10 hover:bg-red-900/20 hover:text-red-400 hover:border-red-600",
    ghost: "border-transparent bg-transparent text-gray-500 hover:text-tech-green hover:bg-void-gray/30",
  };

  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ 
        scale: 0.98,
        backgroundColor: "#E5E5E5", // White Flash
        color: "#000000",           // Black Text
        borderColor: "#E5E5E5",
        transition: { duration: 0.05 } // Instant flash
      }}
      className={cn(baseStyles, variants[variant], className)}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label && <span>{label}</span>}
      
      {/* Corner accents for Primary variant - Hidden during flash by bg color, but structure remains */}
      {variant === 'primary' && (
        <>
          <span className="absolute top-0 left-0 w-[2px] h-[2px] bg-white opacity-0 group-hover:opacity-100" />
          <span className="absolute bottom-0 right-0 w-[2px] h-[2px] bg-white opacity-0 group-hover:opacity-100" />
        </>
      )}
    </MotionButton>
  );
};

export default TechButton;
