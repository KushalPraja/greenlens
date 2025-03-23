"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Award, Recycle, Settings, Leaf, Globe, Compass, 
  Droplets, Zap, Shield, LightbulbIcon, Trophy, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import AuthService from "@/lib/auth"
import PointsService from "@/lib/points"

interface User {
  name: string;
  points: number;
  location?: string;
  avatar?: string;
  badges?: Array<{ name: string }>;
}

interface PointsHistoryEntry {
  action: string;
  amount: number;
  timestamp: string | Date;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isLoggedIn()) {
      window.location.href = "/auth/login"
      return
    }

    // Fetch user profile and points history
    const fetchUserData = async () => {
      try {
        // Force a fresh fetch of user data from the server
        const userData = await AuthService.getCurrentUser()
        setUser(userData)

        const pointsData = await PointsService.getPointsHistory()
        setPointsHistory(pointsData.history || [])
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load user data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Calculate next badge threshold
  const getBadgeAndLevelInfo = () => {
    // Handle case when user is null
    if (!user) {
      return {
        current: 0,
        next: 100,
        progress: 0,
        level: 0,
        nextLevel: 1,
        currentBadge: "No Badge Yet",
        nextBadge: "Eco Seedling",
        badges: []
      };
    }

    // Define all level thresholds and badges (every 100 points up to level 10)
    const badges = [
      { level: 1, points: 100, name: "Eco Seedling", description: "Just started your green journey" },
      { level: 2, points: 200, name: "Green Sprout", description: "Growing your environmental awareness" },
      { level: 3, points: 300, name: "Earth Guardian", description: "Actively protecting our planet" },
      { level: 4, points: 400, name: "Sustainability Scout", description: "Finding new ways to be eco-friendly" },
      { level: 5, points: 500, name: "Waste Warrior", description: "Champion of reducing waste" },
      { level: 6, points: 600, name: "Energy Conservator", description: "Expert at saving energy" },
      { level: 7, points: 700, name: "Water Protector", description: "Dedicated to water conservation" },
      { level: 8, points: 800, name: "Climate Defender", description: "Fighting against climate change" },
      { level: 9, points: 900, name: "Eco Innovator", description: "Creating sustainable solutions" },
      { level: 10, points: 1000, name: "Planet Champion", description: "Mastered sustainable living" },
    ];
    
    // Determine current level and next level
    const currentLevelIndex = Math.max(0, Math.floor(user.points / 100));
    const currentLevel = Math.min(currentLevelIndex, 10);
    const nextLevel = Math.min(currentLevel + 1, 10);
    
    // Get current and next badge
    const currentBadge = currentLevel === 0 ? "No Badge Yet" : badges[currentLevel - 1].name;
    const nextBadge = currentLevel >= 10 ? "Maximum Level Reached!" : badges[nextLevel - 1].name;
    
    // Calculate progress to next level
    const current = currentLevel * 100;
    const next = nextLevel * 100;
    const progress = currentLevel >= 10 ? 100 : Math.min(100, Math.round(((user.points - current) / (next - current)) * 100));
    
    // Return all information
    return {
      current: user.points,
      next,
      progress,
      level: currentLevel,
      nextLevel,
      currentBadge,
      nextBadge,
      badges
    }
  }

  // Helper function to get badge icon based on level
  const getBadgeIcon = (level: number, isUnlocked: boolean) => {
    const activeColor = isUnlocked ? "text-green-600" : "text-gray-400";
    const size = "h-5 w-5";
    
    switch(level) {
      case 1:
        return (
          <svg className={`${size} ${activeColor}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 6a2 2 0 0 0-2 2c0 2 2 4 2 4s2-2 2-4a2 2 0 0 0-2-2z" />
          </svg>
        ); // Seedling custom icon
      case 2:
        return <Leaf className={`${size} ${activeColor}`} />;
      case 3:
        return <Globe className={`${size} ${activeColor}`} />;
      case 4:
        return <Compass className={`${size} ${activeColor}`} />;
      case 5:
        return (
          <svg className={`${size} ${activeColor}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        ); // Recycle bin custom icon
      case 6:
        return <Zap className={`${size} ${activeColor}`} />;
      case 7:
        return <Droplets className={`${size} ${activeColor}`} />;
      case 8:
        return <Shield className={`${size} ${activeColor}`} />;
      case 9:
        return (
          <svg className={`${size} ${activeColor}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18L15 12L9 6" />
            <circle cx="12" cy="12" r="9" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        ); // Innovation custom icon
      case 10:
        return (
          <svg className={`${size} ${activeColor}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        ); // Champion medal custom icon
      default:
        return <Award className={`${size} ${activeColor}`} />;
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Recycle className="mx-auto h-12 w-12 animate-spin text-green-600" />
          <p className="mt-4 text-lg text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { progress, next, nextBadge, level, currentBadge, badges } = getBadgeAndLevelInfo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <Button variant="outline" className="gap-2">
            <Settings size={16} />
            Settings
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 border-4 border-green-100">
                  <AvatarImage src={user?.avatar || `/placeholder.svg?height=96&width=96`} />
                  <AvatarFallback className="bg-green-100 text-lg text-green-800">
                    {user?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-green-800">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.location || "No location set"}</p>
                
                {/* Current Points Display */}
                <div className="mt-6 w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Current Points</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800">
                      <Award className="mr-1 h-3 w-3" />
                      {user?.points} Points
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-green-50 p-4 text-center">
                    <div className="text-3xl font-bold text-green-800">{user?.points}</div>
                    <div className="mt-1 text-sm text-green-600">Total Points Earned</div>
                  </div>
                </div>
                
                {/* Badge Collection */}
                <div className="mt-6 w-full">
                  <h3 className="mb-2 text-sm font-medium text-gray-500">Badge Collection</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pb-2">
                    {getBadgeAndLevelInfo().badges.map((badge, index) => (
                      <div 
                        key={index} 
                        className={`rounded-lg border p-2 text-center transition-all ${level >= badge.level ? 'border-green-500 bg-green-50' : 'opacity-50'}`}
                      >
                        <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full ${level >= badge.level ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {getBadgeIcon(badge.level, level >= badge.level)}
                        </div>
                        <p className="text-xs font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-500">Level {badge.level}</p>
                        {level >= badge.level && (
                          <span className="inline-block mt-1 text-[10px] px-1 py-0.5 bg-green-100 text-green-800 rounded-full">Unlocked!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Level Progress */}
                <div className="mt-6 w-full">
                  <h3 className="mb-2 text-sm font-medium text-gray-500">Level Progress</h3>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm font-medium">
                        {getBadgeIcon(level, true)}
                        <span className="ml-2">Level {level}</span>
                      </span>
                      <span className="text-sm font-medium">{currentBadge}</span>
                    </div>
                    <Progress value={progress} className="my-2 h-2" />
                    {level < 10 && (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{user?.points} points</span>
                        <span>Next: {nextBadge} ({next} pts)</span>
                      </div>
                    )}
                    {level >= 10 && (
                      <div className="text-center text-xs text-green-600 font-medium">
                        Maximum Level Achieved!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity and History */}
          <Card className="md:col-span-2">
            <Tabs defaultValue="activity">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Sustainability Journey</CardTitle>
                  <TabsList>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="points">Points History</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Track your eco-friendly actions and earned points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-4 text-lg font-medium text-green-800">Recent Activity</h3>
                      
                      {pointsHistory && pointsHistory.length > 0 ? (
                        <div className="space-y-4">
                          {pointsHistory.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 border-b pb-4 last:border-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <Recycle className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{activity.action}</p>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-green-50 text-green-800">
                                    +{activity.amount} points
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(activity.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No activity recorded yet. Start your sustainability journey!</p>
                      )}
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 text-lg font-medium text-green-800">Suggested Actions</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Complete these actions to earn more points and badges
                      </p>
                      <div className="space-y-3">
                        <div className="rounded-lg border bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <Recycle className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">Recycle an item</p>
                                <p className="text-xs text-gray-500">Upload a photo of your recycling</p>
                              </div>
                            </div>
                            <Badge>+5 points</Badge>
                          </div>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <Award className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">Find eco-alternatives</p>
                                <p className="text-xs text-gray-500">Use our AI to find better products</p>
                              </div>
                            </div>
                            <Badge>+15 points</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="points" className="mt-0">
                  <div className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-green-800">Points History</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-800">
                        Total: {user?.points} points
                      </Badge>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {pointsHistory && pointsHistory.length > 0 ? (
                        <div className="space-y-3">
                          {pointsHistory.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                              <div>
                                <p className="font-medium">{entry.action}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge className="bg-green-50 text-green-800">
                                +{entry.amount} points
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No points history yet</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

