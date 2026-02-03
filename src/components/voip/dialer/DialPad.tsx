import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialPadProps {
  onDigitPress: (digit: string) => void;
  disabled?: boolean;
}

const digits = [
  { value: "1", letters: "" },
  { value: "2", letters: "ABC" },
  { value: "3", letters: "DEF" },
  { value: "4", letters: "GHI" },
  { value: "5", letters: "JKL" },
  { value: "6", letters: "MNO" },
  { value: "7", letters: "PQRS" },
  { value: "8", letters: "TUV" },
  { value: "9", letters: "WXYZ" },
  { value: "*", letters: "" },
  { value: "0", letters: "+" },
  { value: "#", letters: "" },
];

export function DialPad({ onDigitPress, disabled }: DialPadProps) {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {digits.map(({ value, letters }) => (
        <Button
          key={value}
          variant="outline"
          size="lg"
          disabled={disabled}
          className={cn(
            "h-16 w-full rounded-2xl text-xl font-semibold flex flex-col items-center justify-center",
            "bg-muted/50 hover:bg-muted border-border",
            "transition-all active:scale-95",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => onDigitPress(value)}
        >
          <span>{value}</span>
          {letters && (
            <span className="text-[10px] text-muted-foreground font-normal tracking-widest">
              {letters}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
