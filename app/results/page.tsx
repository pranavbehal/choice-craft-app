/**
 * Results Page Component
 *
 * Displays comprehensive mission statistics and achievements.
 * Features interactive charts and data visualization for user progress.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Share2, Download, Filter } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { missions } from "@/data/missions";
import { type Mission } from "@/types";
import { QuestionButton } from "@/components/help/question-button";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

/**
 * Maps mission IDs to their display names
 * @param {string} missionId - The ID of the mission
 * @returns {string} The display name of the mission
 */
const getMissionName = (missionId: string) => {
  const mission = missions.find((m) => m.id === missionId);
  return mission?.title || `Mission ${missionId}`;
};

export default function ResultsPage() {
  const { user } = useAuth();
  const { missionProgress, loading: dbLoading } = useDatabase();
  const [selectedMission, setSelectedMission] = useState<string>("all");
  const [sortMetric, setSortMetric] = useState("time");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Please sign in to view your results.</p>
        </main>
      </div>
    );
  }

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p>Loading mission data...</p>
        </main>
      </div>
    );
  }

  /**
   * Calculates aggregated metrics for selected missions
   * Includes completion rates, decision types, and time spent
   */
  const filteredProgress = missionProgress.filter((progress) => {
    if (selectedMission === "all") return true;
    return progress.mission_id === selectedMission;
  });

  // Calculate aggregated metrics
  const totalTime = filteredProgress.reduce(
    (sum, p) => sum + parseInt(String(p.time_spent)) || 0,
    0
  );
  const totalDecisions = filteredProgress.reduce(
    (sum, p) => sum + (p.decisions_made || 0),
    0
  );
  const averageCompletion =
    filteredProgress.length > 0
      ? filteredProgress.reduce(
          (sum, p) => sum + (p.completion_percentage || 0),
          0
        ) / filteredProgress.length
      : 0;

  // Decision type distribution
  const decisionTypes = [
    {
      name: "Diplomatic",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.diplomatic_decisions || 0),
        0
      ),
    },
    {
      name: "Strategic",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.strategic_decisions || 0),
        0
      ),
    },
    {
      name: "Action",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.action_decisions || 0),
        0
      ),
    },
    {
      name: "Investigation",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.investigation_decisions || 0),
        0
      ),
    },
  ].filter((d) => d.value > 0);

  // Success metrics
  const successMetrics = [
    {
      name: "Good Decisions",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.good_decisions || 0),
        0
      ),
    },
    {
      name: "Bad Decisions",
      value: filteredProgress.reduce(
        (sum, p) => sum + (p.bad_decisions || 0),
        0
      ),
    },
  ];

  // Mission completion radar data
  const missionRadarData = filteredProgress.map((progress) => ({
    mission: getMissionName(progress.mission_id),
    completion: progress.completion_percentage || 0,
    decisions: progress.decisions_made || 0,
    time: parseInt(String(progress.time_spent)) || 0,
  }));

  /**
   * Exports mission data to CSV format
   * Includes all metrics and achievements
   */
  const exportData = () => {
    const data = filteredProgress.map((progress) => ({
      mission: getMissionName(progress.mission_id),
      status:
        progress.completion_percentage === 100 ? "Complete" : "Not Complete",
      decisions_made: progress.decisions_made,
      good_decisions: progress.good_decisions,
      bad_decisions: progress.bad_decisions,
      diplomatic_decisions: progress.diplomatic_decisions,
      strategic_decisions: progress.strategic_decisions,
      action_decisions: progress.action_decisions,
      investigation_decisions: progress.investigation_decisions,
      time_spent: progress.time_spent,
      achievements: JSON.parse(progress.achievements || "[]").join(", "),
      last_updated: new Date(progress.last_updated).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mission-results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-primary">
            Mission Results
          </h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedMission} onValueChange={setSelectedMission}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Mission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Missions</SelectItem>
                {missions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportData}>
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mission Status</CardTitle>
                  <CardDescription>
                    Overall mission completion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredProgress.map((progress) => (
                      <div
                        key={progress.mission_id}
                        className="flex justify-between items-center"
                      >
                        <span className="text-muted-foreground">
                          {getMissionName(progress.mission_id)}
                        </span>
                        <Badge
                          variant={
                            progress.completion_percentage === 100
                              ? "default"
                              : "secondary"
                          }
                        >
                          {progress.completion_percentage === 100
                            ? "Complete"
                            : "Not Complete"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decision Making Style</CardTitle>
                  <CardDescription>
                    Your preferred approach to challenges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {decisionTypes.map((type) => (
                      <div key={type.name} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {type.name}
                          </span>
                          <span className="font-medium">{type.value}</span>
                        </div>
                        <Progress value={(type.value / totalDecisions) * 100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="decisions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Decision Types</CardTitle>
                  <CardDescription>
                    Distribution of decision types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={decisionTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {decisionTypes.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decision Quality</CardTitle>
                  <CardDescription>Success rate of decisions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={successMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {successMetrics.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? "#00C49F" : "#FF8042"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Mission Performance</CardTitle>
                <CardDescription>
                  Completion, decisions, and time metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={missionRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="mission" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Completion"
                        dataKey="completion"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Decisions"
                        dataKey="decisions"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Time"
                        dataKey="time"
                        stroke="#ffc658"
                        fill="#ffc658"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Earned Achievements</CardTitle>
                <CardDescription>
                  Your accomplishments across all missions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProgress.map((progress) => {
                    const achievements = JSON.parse(
                      progress.achievements || "[]"
                    );
                    return achievements.map(
                      (achievement: string, index: number) => (
                        <Card key={`${progress.mission_id}-${index}`}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {achievement}
                            </CardTitle>
                            <CardDescription>
                              {getMissionName(progress.mission_id)}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      )
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <QuestionButton />
    </div>
  );
}
