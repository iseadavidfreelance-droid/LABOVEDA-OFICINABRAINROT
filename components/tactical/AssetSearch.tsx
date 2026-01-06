
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { mockService } from '../../lib/supabase';
import { BusinessAsset } from '../../types/database';
import TechInput from '../ui/TechInput';
import RarityBadge from '../ui/RarityBadge';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetSearchProps {
  onSelect: (asset: BusinessAsset) => void;
}

const AssetSearch: React.FC<AssetSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const MotionDiv = motion.div as any;
  
  // Use SKU as key identifier logic internally if needed, 
  // but we just pass the full object up.

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await mockService.searchAssets(query);
        setResults(data);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (asset: BusinessAsset) => {
    onSelect(asset);
    setQuery(asset.sku); // Show SKU in input after selection
    setResults([]); // Close dropdown
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <TechInput 
          placeholder="BUSCAR POR SKU O NOMBRE..." 
          value={query}
          onChange={(e) => {
             setQuery(e.target.value);
          }}
          className="pl-10 uppercase"
        />
        <Search className="absolute left-2 top-2.5 w-4 h-4 text-tech-green animate-pulse" />
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <MotionDiv 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full mt-2 bg-void-black border border-void-border z-20 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {results.map((asset) => (
              <button
                key={asset.sku}
                onClick={() => handleSelect(asset)}
                className="w-full text-left p-3 border-b border-void-border/50 hover:bg-void-gray flex items-center justify-between group transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-white group-hover:text-tech-green transition-colors">{asset.name}</span>
                  <span className="text-[10px] text-gray-500 tracking-wider">SKU: {asset.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600">{asset.score} PTS</span>
                    <RarityBadge tier={asset.tier} className="scale-75 origin-right" />
                </div>
              </button>
            ))}
          </MotionDiv>
        )}
      </AnimatePresence>
      
      {loading && (
        <div className="absolute right-2 top-3">
          <div className="w-2 h-2 bg-tech-green animate-ping rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default AssetSearch;