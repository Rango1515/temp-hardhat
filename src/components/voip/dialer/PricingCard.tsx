import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PRICING = [
  { service: "Standard Landing Page", build: "$300", hosting: "$25/mo" },
  { service: "Advanced Website", build: "$500", hosting: "$30/mo" },
  { service: "Full Custom Website", build: "$1,500", hosting: "$50/mo" },
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
                      Build cost is one-time. Hosting includes updates and support — competitive with industry averages.
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
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="font-semibold text-foreground">{item.build}</span>
                    <span className="text-muted-foreground">+</span>
                    <span className="font-semibold text-foreground">{item.hosting}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Prices are negotiable — use your discretion based on the client's needs.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
