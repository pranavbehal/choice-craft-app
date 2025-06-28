/**
 * Leaderboard Page Component
 *
 * Displays competitive rankings and achievements across all Choice Craft players.
 * Features sortable tables and an enhanced podium for top performers.
 *
 * @component
 */

"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Trophy,
  Medal,
  Star,
  Target,
  Clock,
  Award,
  Search,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLeaderboardData,
  type NewLeaderboardEntry,
} from "@/lib/leaderboardUtils";
import { toast } from "sonner";
import { QuestionButton } from "@/components/help/question-button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarPath, getUserDisplayName } from "@/lib/utils";
import Image from "next/image";
import { useRef } from "react";

type LeaderboardEntry = NewLeaderboardEntry & {
  rank?: number;
};

type SortField =
  | "total_xp"
  | "level"
  | "missions_completed"
  | "success_rate"
  | "achievements_unlocked"
  | "total_decisions"
  | "total_playtime_seconds";

type SortOrder = "asc" | "desc";

/**
 * Formats time from seconds to readable format
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Gets appropriate rank color based on position
 */
const getRankColor = (rank: number): string => {
  if (rank === 1) return "text-yellow-600";
  if (rank === 2) return "text-gray-500";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
};

/**
 * Gets appropriate crown icon based on position
 */
const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-500" />;
  return (
    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  );
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_xp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const loadingRef = useRef(false); // Track if currently loading

  // Remove component key to prevent unnecessary re-mounts

  // Load leaderboard data - only load once and when user changes
  useEffect(() => {
    const loadData = async () => {
      console.log("🔍 Leaderboard: Loading data", {
        isHidden: document.hidden,
        isCurrentlyLoading: loadingRef.current,
        hasData: leaderboardData.length > 0,
      });

      // Prevent duplicate loading
      if (loadingRef.current) {
        console.log("⏳ Already loading leaderboard, skipping...");
        return;
      }

      // If we already have data and user hasn't changed, don't reload
      if (leaderboardData.length > 0 && !document.hidden) {
        console.log("📊 Leaderboard data already loaded, skipping...");
        setLoading(false);
        return;
      }

      // Load data when component mounts or when user changes
      if (!document.hidden) {
        console.log("🏆 Loading leaderboard data...");
        loadingRef.current = true;
        try {
          setLoading(true);

          // Try to load data for both logged in and logged out users
          const data = await getLeaderboardData(!user); // publicAccess = true when no user
          setLeaderboardData(data);
          console.log("✅ Leaderboard data loaded successfully");
        } catch (error) {
          console.error("Error loading leaderboard:", error);
          toast.error("Failed to load leaderboard data");
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadData();
  }, [user?.id]); // Depend on user ID to reload when user changes

  // Get top 3 from original data (not filtered) - always sorted by total_xp desc
  const topThree = useMemo(() => {
    return [...leaderboardData]
      .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
      .slice(0, 3)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [leaderboardData]);

  // Filter and sort data for the table
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...leaderboardData];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((entry) =>
        (entry.user_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Add rank numbers
    return filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [leaderboardData, searchQuery, sortField, sortOrder]);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to descending for new sorts
    }
  };

  // Get sort icon with active state styling
  const getSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    const iconClasses = `h-4 w-4 ${isActive ? "text-white" : "opacity-50"}`;

    if (!isActive) {
      return <ArrowUpDown className={iconClasses} />;
    }

    return sortOrder === "asc" ? (
      <ArrowUpDown className={`${iconClasses} rotate-180`} />
    ) : (
      <ArrowUpDown className={iconClasses} />
    );
  };

  // Get header styling for active sort
  const getHeaderStyling = (field: SortField) => {
    const isActive = sortField === field;
    return {
      className: `cursor-pointer hover:bg-muted/50 ${
        isActive ? "text-white font-bold" : ""
      }`,
    };
  };

  // Find current user's position in filtered results
  const currentUserEntry = user
    ? filteredAndSortedData.find((entry) => entry.user_id === user.id)
    : null;

  // Get display name for users, prioritizing database name
  const getDisplayName = (entry: LeaderboardEntry) => {
    // If this is the current user, prioritize their database name but fall back to auth metadata
    if (user && entry.user_id === user.id) {
      return getUserDisplayName(entry.user_name, user);
    }

    // For other users, use the stored name from database
    return entry.user_name || `Player ${entry.user_id.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="scroll-m-20 text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Compete with players worldwide and climb the ranks in Choice Craft
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Podium skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-end gap-4 h-64">
                  <Skeleton className="w-24 h-32" />
                  <Skeleton className="w-24 h-40" />
                  <Skeleton className="w-24 h-28" />
                </div>
              </CardContent>
            </Card>

            {/* Table skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Podium */}
            {topThree.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-primary">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Top Champions
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </CardTitle>
                  <CardDescription>
                    The ultimate Choice Craft legends
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 md:p-8">
                  {/* Mobile-friendly podium layout */}
                  <div className="flex items-end justify-center gap-1 xs:gap-2 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto min-h-[280px] sm:min-h-[320px] pb-2">
                    {/* 2nd Place */}
                    {topThree.length > 1 && (
                      <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
                        <div className="relative mb-3 sm:mb-4 md:mb-6">
                          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 sm:border-3 md:border-4 border-gray-300 relative z-10 shadow-lg rounded-full overflow-hidden">
                            <Image
                              src={getAvatarPath(topThree[1].profile_picture)}
                              alt={`${getDisplayName(topThree[1])}'s avatar`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gray-200 rounded-full p-1.5 sm:p-2 shadow-lg">
                            <Medal className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600" />
                          </div>
                          <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gray-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                              2nd
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-xl px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 h-24 sm:h-28 md:h-32 flex flex-col justify-between items-center w-[90px] xs:w-[100px] sm:w-[140px] md:w-[180px] lg:w-[220px] shadow-lg border border-gray-200">
                          <div className="flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                            <p className="text-xs sm:text-sm text-gray-600">
                              Lv {topThree[1].level}
                            </p>
                          </div>
                          <h3 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base text-center px-1 leading-tight truncate">
                            {getDisplayName(topThree[1])}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-600 font-mono">
                            {topThree[1].total_xp.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
                      <div className="relative mb-3 sm:mb-4 md:mb-6">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-3 sm:border-4 border-yellow-400 relative z-10 shadow-xl rounded-full overflow-hidden">
                          <Image
                            src={getAvatarPath(topThree[0].profile_picture)}
                            alt={`${getDisplayName(topThree[0])}'s avatar`}
                            width={112}
                            height={112}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-2 sm:p-3 shadow-xl">
                          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-800" />
                        </div>
                        <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-yellow-500 text-yellow-900 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold">
                            1st
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-xl px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 h-28 sm:h-32 md:h-40 flex flex-col justify-between items-center w-[100px] xs:w-[110px] sm:w-[150px] md:w-[190px] lg:w-[240px] shadow-xl border-2 border-yellow-400">
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-800" />
                          <p className="text-xs sm:text-sm text-yellow-800 font-semibold">
                            Lv {topThree[0].level}
                          </p>
                        </div>
                        <h3 className="font-bold text-yellow-900 text-sm sm:text-base md:text-lg text-center px-1 leading-tight truncate">
                          {getDisplayName(topThree[0])}
                        </h3>
                        <div className="space-y-0.5 sm:space-y-1 text-center">
                          <p className="text-xs sm:text-sm text-yellow-800 font-mono">
                            {topThree[0].total_xp.toLocaleString()} XP
                          </p>
                          <Badge className="bg-yellow-800 text-yellow-100 shadow-lg text-xs">
                            Champion
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    {topThree.length > 2 && (
                      <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
                        <div className="relative mb-3 sm:mb-4 md:mb-6">
                          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 sm:border-3 md:border-4 border-orange-600 relative z-10 shadow-lg rounded-full overflow-hidden">
                            <Image
                              src={getAvatarPath(topThree[2].profile_picture)}
                              alt={`${getDisplayName(topThree[2])}'s avatar`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-orange-400 rounded-full p-1.5 sm:p-2 shadow-lg">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-800" />
                          </div>
                          <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-orange-600 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                              3rd
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 h-20 sm:h-24 md:h-28 flex flex-col justify-between items-center w-[90px] xs:w-[100px] sm:w-[140px] md:w-[180px] lg:w-[220px] shadow-lg border border-orange-500">
                          <div className="flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-100" />
                            <p className="text-xs sm:text-sm text-orange-100">
                              Lv {topThree[2].level}
                            </p>
                          </div>
                          <h3 className="font-bold text-white text-xs sm:text-sm md:text-base text-center px-1 leading-tight truncate">
                            {getDisplayName(topThree[2])}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-orange-100 font-mono">
                            {topThree[2].total_xp.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current user position indicator */}
                  {currentUserEntry && currentUserEntry.rank! > 3 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Your position:{" "}
                        <span className="font-semibold">
                          #{currentUserEntry.rank}
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sortable Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      All Players
                    </CardTitle>
                    <CardDescription>
                      {filteredAndSortedData.length} player
                      {filteredAndSortedData.length !== 1 ? "s" : ""} ranked
                      {searchQuery && " (filtered)"}
                    </CardDescription>
                  </div>

                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Call-to-action for logged out users */}
                {!user && leaderboardData.length > 0 && (
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                      <div>
                        <h3 className="font-semibold text-primary mb-1">
                          Join the Competition!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Create an account and complete missions to claim your
                          spot on the leaderboard
                        </p>
                      </div>
                      <Button
                        onClick={() => (window.location.href = "/")}
                        className="whitespace-nowrap"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                )}

                {filteredAndSortedData.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {leaderboardData.length === 0
                        ? "No players yet"
                        : "No players match your search"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {leaderboardData.length === 0
                        ? "Be the first to complete a mission and claim your spot!"
                        : "Try adjusting your search criteria"}
                    </p>
                    {!user && leaderboardData.length === 0 && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-primary mb-3">
                          <strong>
                            Create an account and complete a mission to get on
                            the leaderboard!
                          </strong>
                        </p>
                        <Button
                          onClick={() => (window.location.href = "/")}
                          className="text-sm"
                        >
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile Sort Controls */}
                    <div className="lg:hidden mb-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">
                            Sort by
                          </label>
                          <select
                            value={sortField}
                            onChange={(e) =>
                              handleSort(e.target.value as SortField)
                            }
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          >
                            <option value="total_xp">Total XP</option>
                            <option value="level">Level</option>
                            <option value="missions_completed">
                              Missions Completed
                            </option>
                            <option value="success_rate">Success Rate</option>
                            <option value="achievements_unlocked">
                              Achievements
                            </option>
                            <option value="total_decisions">
                              Total Decisions
                            </option>
                            <option value="total_playtime_seconds">
                              Playtime
                            </option>
                          </select>
                        </div>
                        <div className="flex-shrink-0">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">
                            Order
                          </label>
                          <button
                            onClick={() =>
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                            }
                            className="px-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:bg-muted flex items-center gap-2 min-w-[100px] justify-center"
                          >
                            {sortOrder === "desc" ? (
                              <>
                                <ArrowDown className="h-4 w-4" />
                                High to Low
                              </>
                            ) : (
                              <>
                                <ArrowUp className="h-4 w-4" />
                                Low to High
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {filteredAndSortedData.map((entry) => (
                        <Card
                          key={entry.user_id}
                          className={
                            entry.user_id === user?.id
                              ? "border-primary/20 bg-primary/5"
                              : ""
                          }
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center">
                                  {getRankIcon(entry.rank!)}
                                </div>
                                <Image
                                  src={getAvatarPath(entry.profile_picture)}
                                  alt={`${entry.user_name}'s avatar`}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {getDisplayName(entry)}
                                    {entry.user_id === user?.id && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Level {entry.level}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold">
                                  {entry.total_xp.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  XP
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Missions:
                                </span>
                                <span className="font-medium">
                                  {entry.missions_completed}/4
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Success:
                                </span>
                                <span className="font-medium">
                                  {entry.success_rate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Achievements:
                                </span>
                                <span className="font-medium">
                                  {entry.achievements_unlocked}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Playtime:
                                </span>
                                <span className="font-medium">
                                  {formatTime(entry.total_playtime_seconds)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2 text-sm">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Total Decisions:
                                </span>
                                <span className="font-medium">
                                  {entry.total_decisions}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead className="min-w-[200px]">
                              Player
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("total_xp")}
                              onClick={() => handleSort("total_xp")}
                              className="min-w-[120px]"
                            >
                              <div className="flex items-center gap-2">
                                <Zap
                                  className={`h-4 w-4 ${
                                    sortField === "total_xp" ? "text-white" : ""
                                  }`}
                                />
                                Total XP {getSortIcon("total_xp")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("level")}
                              onClick={() => handleSort("level")}
                              className="min-w-[100px]"
                            >
                              <div className="flex items-center gap-2">
                                <Star
                                  className={`h-4 w-4 ${
                                    sortField === "level" ? "text-white" : ""
                                  }`}
                                />
                                Level {getSortIcon("level")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("missions_completed")}
                              onClick={() => handleSort("missions_completed")}
                              className="min-w-[120px]"
                            >
                              <div className="flex items-center gap-2">
                                <Trophy
                                  className={`h-4 w-4 ${
                                    sortField === "missions_completed"
                                      ? "text-white"
                                      : ""
                                  }`}
                                />
                                Missions {getSortIcon("missions_completed")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("success_rate")}
                              onClick={() => handleSort("success_rate")}
                              className="min-w-[130px]"
                            >
                              <div className="flex items-center gap-2">
                                <Target
                                  className={`h-4 w-4 ${
                                    sortField === "success_rate"
                                      ? "text-white"
                                      : ""
                                  }`}
                                />
                                Success Rate {getSortIcon("success_rate")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("achievements_unlocked")}
                              onClick={() =>
                                handleSort("achievements_unlocked")
                              }
                              className="min-w-[140px]"
                            >
                              <div className="flex items-center gap-2">
                                <Award
                                  className={`h-4 w-4 ${
                                    sortField === "achievements_unlocked"
                                      ? "text-white"
                                      : ""
                                  }`}
                                />
                                Achievements{" "}
                                {getSortIcon("achievements_unlocked")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("total_decisions")}
                              onClick={() => handleSort("total_decisions")}
                              className="min-w-[120px]"
                            >
                              <div className="flex items-center gap-2">
                                <BarChart3
                                  className={`h-4 w-4 ${
                                    sortField === "total_decisions"
                                      ? "text-white"
                                      : ""
                                  }`}
                                />
                                Decisions {getSortIcon("total_decisions")}
                              </div>
                            </TableHead>
                            <TableHead
                              {...getHeaderStyling("total_playtime_seconds")}
                              onClick={() =>
                                handleSort("total_playtime_seconds")
                              }
                              className="min-w-[120px]"
                            >
                              <div className="flex items-center gap-2">
                                <Clock
                                  className={`h-4 w-4 ${
                                    sortField === "total_playtime_seconds"
                                      ? "text-white"
                                      : ""
                                  }`}
                                />
                                Playtime {getSortIcon("total_playtime_seconds")}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedData.map((entry) => (
                            <TableRow
                              key={entry.user_id}
                              className={
                                entry.user_id === user?.id
                                  ? "bg-primary/5 border-primary/20"
                                  : ""
                              }
                            >
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {getRankIcon(entry.rank!)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Image
                                    src={getAvatarPath(entry.profile_picture)}
                                    alt={`${entry.user_name}'s avatar`}
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {getDisplayName(entry)}
                                      {entry.user_id === user?.id && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs"
                                        >
                                          You
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">
                                {entry.total_xp.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{entry.level}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{entry.missions_completed}/4</span>
                                  <Progress
                                    value={(entry.missions_completed / 4) * 100}
                                    className="w-16 h-2"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{entry.success_rate.toFixed(1)}%</span>
                                  <Progress
                                    value={entry.success_rate}
                                    className="w-16 h-2"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {entry.achievements_unlocked}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">
                                {entry.total_decisions.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {formatTime(entry.total_playtime_seconds)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <QuestionButton />
    </div>
  );
}
