/**
 * MetricCard Component
 *
 * Reusable card component for displaying key metrics with icons.
 * Used across results and other analytics pages.
 */

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  value,
  label,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold">{value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
