 import { useEffect, useState, useCallback } from "react";
 import { Clock } from "lucide-react";
 
 interface SessionTimerProps {
   startTime: number | null;
   onDurationChange?: (seconds: number) => void;
 }
 
 export function SessionTimer({ startTime, onDurationChange }: SessionTimerProps) {
   const [seconds, setSeconds] = useState(0);
 
   const calculateDuration = useCallback(() => {
     if (!startTime) return 0;
     return Math.floor((Date.now() - startTime) / 1000);
   }, [startTime]);
 
   useEffect(() => {
     if (!startTime) {
       setSeconds(0);
       return;
     }
 
     // Set initial value
     setSeconds(calculateDuration());
 
     const interval = setInterval(() => {
       const newValue = calculateDuration();
       setSeconds(newValue);
       onDurationChange?.(newValue);
     }, 1000);
 
     return () => clearInterval(interval);
   }, [startTime, onDurationChange, calculateDuration]);
 
   const formatTime = (totalSeconds: number) => {
     const hours = Math.floor(totalSeconds / 3600);
     const minutes = Math.floor((totalSeconds % 3600) / 60);
     const secs = totalSeconds % 60;
 
     if (hours > 0) {
       return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
     }
     return `${minutes}:${secs.toString().padStart(2, "0")}`;
   };
 
   if (!startTime) return null;
 
   return (
     <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
       <Clock className="w-5 h-5 text-primary animate-pulse" />
       <div>
         <span className="text-2xl font-mono font-medium text-primary">
           {formatTime(seconds)}
         </span>
         <p className="text-xs text-muted-foreground">Session Duration</p>
       </div>
     </div>
   );
 }