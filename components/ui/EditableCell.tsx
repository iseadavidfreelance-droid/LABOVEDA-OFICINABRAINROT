
import React, { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check, Edit2 } from 'lucide-react';
import { useLog } from '../../context/LogContext';

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'url';
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  onSave, 
  placeholder = "VACÍO", 
  type = 'text',
  className 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { addLog } = useLog();
  const MotionSpan = motion.span as any;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setIsEditing(true);
    setTempValue(value || "");
    setHasError(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
    setHasError(false);
  };

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setHasError(false);
    
    try {
      await onSave(tempValue);
      setIsSuccess(true);
      addLog(`DATA FIELD UPDATED: ${tempValue.substring(0, 20)}...`, 'success');
      setTimeout(() => setIsSuccess(false), 2000);
      setIsEditing(false);
    } catch (error) {
      console.error("Save failed", error);
      setHasError(true);
      addLog("WRITE OPERATION FAILED: PERMISSION DENIED OR INVALID SYNTAX", 'error');
      // Keep editing mode open so user can fix it
      // Shake animation plays via class
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // RENDER: EDIT MODE
  if (isEditing) {
    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type={type}
          value={tempValue}
          onChange={(e) => {
             setTempValue(e.target.value);
             if (hasError) setHasError(false); // Clear error on edit
          }}
          onBlur={!hasError ? handleSave : undefined} // Don't auto-save if already errored, let user fix
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(
            "w-full bg-black text-white font-mono text-xs border p-1 outline-none shadow-[0_0_10px_rgba(0,255,65,0.2)]",
            hasError ? "border-red-500 animate-shake-glitch text-red-500" : "border-tech-green",
            className
          )}
          placeholder={placeholder}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
             <div className="w-2 h-2 bg-tech-green animate-spin rounded-sm"></div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: IDLE MODE
  return (
    <div 
        onClick={handleStartEdit}
        className="group cursor-pointer flex items-center justify-between gap-2 min-h-[24px] px-2 py-1 hover:bg-void-gray/50 transition-colors border border-transparent hover:border-void-border/50 rounded-sm"
    >
      <MotionSpan 
        animate={{ color: isSuccess ? "#00FF41" : (value ? "#E5E5E5" : "#4A4A4A") }}
        className={cn(
           "font-mono text-xs truncate w-full",
           !value && "italic"
        )}
      >
        {value || placeholder}
      </MotionSpan>
      
      {/* Icons */}
      {isSuccess ? (
          <Check className="w-3 h-3 text-tech-green flex-none" />
      ) : (
          <Edit2 className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-none" />
      )}
    </div>
  );
};

export default EditableCell;
