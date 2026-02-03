import { useEffect, useState } from "react";

interface CallTimerProps {
  isRunning: boolean;
  onDurationChange?: (seconds: number) => void;
}

export function CallTimer({ isRunning, onDurationChange }: CallTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newValue = prev + 1;
        onDurationChange?.(newValue);
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onDurationChange]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center">
      <span className="text-2xl font-mono font-medium text-foreground">
        {formatTime(seconds)}
      </span>
    </div>
  );
}
