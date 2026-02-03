import { Check, X } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const comparisonData = [
  {
    feature: "Mail Hosting",
    hardhat: "Unlimited Accounts",
    others: "Extra Fee",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "File Manager",
    hardhat: "Web-Based + FTP",
    others: "Limited",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "Support",
    hardhat: "Local Rancho Team",
    others: "Outsourced Bots",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "Storage",
    hardhat: "NVMe SSD",
    others: "Standard HDD",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "SSL Certificates",
    hardhat: "Free (Included)",
    others: "$50-100/year",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "Setup Time",
    hardhat: "Same Day",
    others: "3-5 Business Days",
    hardhatGood: true,
    othersGood: false,
  },
  {
    feature: "Backups",
    hardhat: "Daily (Automatic)",
    others: "Extra Fee",
    hardhatGood: true,
    othersGood: false,
  },
];

const ComparisonTable = () => {
  return (
    <section className="py-20 md:py-32 bg-secondary/50 section-divider">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Compare & Decide
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            WHY HOST
            <span className="text-gradient"> WITH US?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how Hardhat Hosting stacks up against the big-box hosting companies.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={100}>
          {/* Desktop Table */}
          <div className="hidden md:block glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-6 text-muted-foreground font-semibold">
                    Feature
                  </th>
                  <th className="p-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2">
                      <span className="text-primary font-display text-lg">Hardhat Hosting</span>
                    </div>
                  </th>
                  <th className="p-6 text-center text-muted-foreground/60 font-semibold">
                    The "Other" Guys
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index !== comparisonData.length - 1 ? "border-b border-border/20" : ""}
                  >
                    <td className="p-6 text-foreground font-medium">
                      {row.feature}
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">{row.hardhat}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-60">
                        <X className="w-5 h-5 text-destructive" />
                        <span className="text-muted-foreground">{row.others}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {comparisonData.map((row) => (
              <div key={row.feature} className="glass rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">
                  {row.feature}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-semibold">Hardhat</span>
                    </div>
                    <div className="text-foreground text-sm font-medium">{row.hardhat}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 opacity-60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <X className="w-4 h-4 text-destructive" />
                      <span className="text-xs text-muted-foreground font-semibold">Others</span>
                    </div>
                    <div className="text-muted-foreground text-sm">{row.others}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ComparisonTable;
