
import React, { useEffect, useState } from "react";
import { Clock, Activity, Database, Globe } from "lucide-react";
import StatusIndicator from "../ui/StatusIndicator";
import { mockService } from "../../lib/supabase";
import MatrixCommandStrip from "./MatrixCommandStrip";

const GlobalHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [heartbeat, setHeartbeat] = useState<{status: string, processed: number}>({ status: 'STANDBY', processed: 0 });
  const [kpis, setKpis] = useState<{assets: number, nodes: number}>({ assets: 0, nodes: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Simulating Data Fetching
    mockService.getSystemHeartbeat().then(data => {
      setHeartbeat({ status: data.status, processed: data.records_processed });
    });

    mockService.getGlobalKPIs().then(data => {
      setKpis({ assets: data.total_assets, nodes: data.total_nodes });
    });

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, timeZone?: string) => {
    return date.toLocaleTimeString('en-US', { 
      timeZone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  return (
    <header className="h-16 border-b border-void-border bg-black/90 backdrop-blur-sm flex items-center justify-between px-0 z-10">
      
      {/* LEFT: MATRIX COMMAND STRIP */}
      <div className="h-full">
         <MatrixCommandStrip />
      </div>

      {/* CENTER: Clocks & KPIs */}
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">LOCAL SYSTEM</span>
            <div className="text-lg font-mono text-white leading-none flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-600" />
                {formatTime(time)}
            </div>
            </div>
            <div className="h-8 w-[1px] bg-void-border"></div>
            <div className="flex flex-col">
            <span className="text-[10px] text-tech-green font-mono uppercase tracking-wider">UTC NET</span>
            <div className="text-lg font-mono text-gray-400 leading-none">
                {formatTime(time, 'UTC')}
            </div>
            </div>
        </div>
      </div>

      {/* RIGHT: SYSTEM HEARTBEAT */}
      <div className="flex items-center gap-4 px-6">
        <div className="text-right hidden md:block">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">INGESTION CYCLE</div>
            <div className="font-mono text-xs text-tech-green">
               {heartbeat.processed} RECS PROCESSED
            </div>
        </div>
        <div className="border border-void-border bg-void-gray/50 px-3 py-2 flex items-center gap-3">
            <Activity className="w-4 h-4 text-gray-400" />
            <StatusIndicator 
                status={heartbeat.status === 'RUNNING' ? 'processing' : 'standby'} 
                label={heartbeat.status} 
            />
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
