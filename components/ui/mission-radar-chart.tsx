/**
 * MissionRadarChart Component
 *
 * Reusable radar chart component for displaying mission-specific
 * decision analysis and performance metrics.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type Mission, type MissionProgress } from "@/types";

interface MissionRadarChartProps {
  mission: Mission;
  missionProgress?: MissionProgress;
}

export function MissionRadarChart({
  mission,
  missionProgress,
}: MissionRadarChartProps) {
  const radarData = [
    {
      decision: "Diplomatic",
      count: missionProgress?.diplomatic_decisions || 0,
      good: missionProgress?.diplomatic_good_decisions || 0,
      bad: missionProgress?.diplomatic_bad_decisions || 0,
    },
    {
      decision: "Strategic",
      count: missionProgress?.strategic_decisions || 0,
      good: missionProgress?.strategic_good_decisions || 0,
      bad: missionProgress?.strategic_bad_decisions || 0,
    },
    {
      decision: "Action",
      count: missionProgress?.action_decisions || 0,
      good: missionProgress?.action_good_decisions || 0,
      bad: missionProgress?.action_bad_decisions || 0,
    },
    {
      decision: "Investigation",
      count: missionProgress?.investigation_decisions || 0,
      good: missionProgress?.investigation_good_decisions || 0,
      bad: missionProgress?.investigation_bad_decisions || 0,
    },
  ];

  const totalDecisions = missionProgress?.decisions_made || 0;
  const hasDecisions = totalDecisions > 0;
  const goodDecisions = missionProgress?.good_decisions || 0;
  const badDecisions = missionProgress?.bad_decisions || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2 text-center">
          <span className="text-base">{mission.title}</span>
          <Badge variant="outline" className="text-xs">
            {mission.difficulty}
          </Badge>
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {totalDecisions} total decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasDecisions ? (
          <div className="space-y-4">
            <ChartContainer
              config={{
                count: {
                  label: "Total Decisions",
                  color: "#3b82f6",
                },
                good: {
                  label: "Good Decisions",
                  color: "#10b981",
                },
              }}
              className="mx-auto aspect-square max-h-[220px] sm:max-h-[280px] w-full"
            >
              <RadarChart
                data={radarData}
                margin={{
                  top: 30,
                  right: 30,
                  bottom: 30,
                  left: 30,
                }}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <PolarAngleAxis dataKey="decision" />
                <PolarGrid />
                <Radar
                  dataKey="count"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Radar
                  dataKey="good"
                  fill="#10b981"
                  fillOpacity={0.4}
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>

            {/* Custom Legend */}
            <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Total Decisions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Good Decisions</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No decisions made yet
          </div>
        )}

        {/* Summary stats for this mission */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-background border border-border rounded">
            <div className="flex items-center justify-center gap-1">
              <span className="font-bold text-lg text-emerald-500">
                {goodDecisions}
              </span>
              <span className="text-muted-foreground">Good</span>
            </div>
          </div>
          <div className="text-center p-2 bg-background border border-border rounded">
            <div className="flex items-center justify-center gap-1">
              <span className="font-bold text-lg text-red-500">
                {badDecisions}
              </span>
              <span className="text-muted-foreground">Bad</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
