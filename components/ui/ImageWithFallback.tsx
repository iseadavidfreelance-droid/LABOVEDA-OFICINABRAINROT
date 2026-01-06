
import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, ...props }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'loaded'>('loading');
  const MotionDiv = motion.div as any;

  return (
    <div className={cn("relative overflow-hidden bg-void-gray/20", className)}>
      {/* LOADING STATE */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 text-tech-green animate-spin" />
        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' ? (
        <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-void-black border border-void-border p-2"
        >
            <ImageOff className="w-8 h-8 text-gray-700 mb-2" />
            <span className="text-[9px] font-mono text-gray-600 uppercase text-center tracking-widest">SIGNAL LOST</span>
            <div className="w-full h-[1px] bg-red-900/50 mt-2"></div>
            <span className="text-[8px] font-mono text-red-900 mt-1">ERR_404_IMG</span>
        </MotionDiv>
      ) : (
        /* ACTUAL IMAGE */
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            status === 'loading' ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          {...props}
        />
      )}
      
      {/* Cyberpunk Overlay for loaded images */}
      {status === 'loaded' && (
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-60" />
      )}
    </div>
  );
};

export default ImageWithFallback;
