"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Edit, Award, Recycle, Upload, Settings, ChevronRight } from "lucide-react"
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
  const getNextBadgeProgress = () => {
    if (!user) return { current: 0, next: 100, progress: 0, nextBadge: "Eco Starter" }

    const thresholds = [
      { points: 100, name: "Eco Starter" },
      { points: 500, name: "Green Enthusiast" },
      { points: 1000, name: "Sustainability Champion" },
      { points: 5000, name: "Environmental Hero" },
    ]

    // Find the next badge the user doesn't have yet
    const nextBadgeIndex = thresholds.findIndex(
      threshold => user.points < threshold.points
    )

    if (nextBadgeIndex === -1) {
      // User has all badges
      return {
        current: user.points,
        next: thresholds[thresholds.length - 1].points,
        progress: 100,
        nextBadge: "Maxed Out!"
      }
    }

    const current = nextBadgeIndex === 0 ? 0 : thresholds[nextBadgeIndex - 1].points
    const next = thresholds[nextBadgeIndex].points
    const progress = Math.min(100, Math.round(((user.points - current) / (next - current)) * 100))

    return {
      current: user.points,
      next,
      progress,
      nextBadge: thresholds[nextBadgeIndex].name
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

  const { progress, next, nextBadge } = getNextBadgeProgress()

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
                
                <div className="mt-6 w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Current Points</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800">
                      <Award className="mr-1 h-3 w-3" />
                      {user?.points} Points
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Level Progress</span>
                    <span>{user?.points} / {next} for {nextBadge}</span>
                  </div>
                </div>
                
                <div className="mt-6 w-full">
                  <h3 className="mb-2 text-sm font-medium text-gray-500">Badges Earned</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {user?.badges && user.badges.length > 0 ? (
                      user.badges.map((badge, index) => (
                        <div key={index} className="rounded-lg border p-2 text-center">
                          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <Award className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-xs font-medium">{badge.name}</p>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-center text-sm text-gray-500">
                        Complete actions to earn badges!
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 w-full space-y-2">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile
                    </span>
                    <ChevronRight size={16} />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Avatar
                    </span>
                    <ChevronRight size={16} />
                  </Button>
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
                                <Upload className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">Share a sustainable tip</p>
                                <p className="text-xs text-gray-500">Help others with your knowledge</p>
                              </div>
                            </div>
                            <Badge>+10 points</Badge>
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

