import React, { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface TechInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

const TechInput = React.forwardRef<HTMLInputElement, TechInputProps>(
  ({ label, error, className, ...props }, ref) => {
    // Casting motion.div to any to avoid TypeScript errors
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
            ref={ref}
            className={cn(
              // BASE ORIGINAL RESPETADA
              "w-full font-mono text-sm placeholder-gray-600",
              "py-2 px-1 rounded-none outline-none",
              "border-b-2 border-void-border transition-colors duration-300",
              
              // CORRECCIÓN VISUAL NUCLEAR: Fondo Negro y Texto Blanco
              "!bg-black !text-[#E5E5E5]", 
              
              // ESTADOS
              "focus:border-tech-green focus:bg-tech-green/5",
              error ? "border-red-600 text-red-500 focus:border-red-500" : "",
              className
            )}
            autoComplete="off"
            spellCheck={false}
            {...props}
          />
          
          {/* EFECTO SCANLINE ORIGINAL (Preservado) */}
          <MotionDiv 
            className="absolute bottom-0 left-0 h-[2px] bg-tech-green"
            initial={{ width: "0%" }}
            whileInView={{ width: "0%" }} 
            animate={{ width: "0%" }} 
            whileFocus={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }
);

TechInput.displayName = 'TechInput';

export default TechInput;