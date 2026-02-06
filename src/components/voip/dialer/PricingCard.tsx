import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PRICING = [
  { service: "Standard Hosting / Landing Page", price: "$25/mo" },
  { service: "Advanced Website + Hosting", price: "$30/mo" },
  { service: "Full Custom Website + Hosting", price: "$50/mo" },
];

export function PricingCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Current Pricing
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p className="text-xs">
                      These prices include hosting, updates, and support — competitive with industry averages.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            <div className="space-y-1.5">
              {PRICING.map((item) => (
                <div
                  key={item.service}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded bg-muted/50"
                >
                  <span className="text-muted-foreground truncate">{item.service}</span>
                  <span className="font-semibold text-foreground whitespace-nowrap">{item.price}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Includes hosting, updates, and support
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
