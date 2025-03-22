"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Trophy,
  Award,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Medal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PointsService from "@/lib/points"
import AuthService from "@/lib/auth"

interface User {
  _id: string
  name: string
  avatar?: string
  points: number
  totalPoints?: number
  badges?: any[]
}

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [timeframe, setTimeframe] = useState("all")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        if (AuthService.isLoggedIn()) {
          const user = await AuthService.getCurrentUser()
          setCurrentUser(user)
        }
        
        const result = await PointsService.getLeaderboard(
          pagination.currentPage,
          timeframe
        )
        
        setLeaderboard(result.users || [])
        setPagination({
          currentPage: result.pagination.page,
          totalPages: result.pagination.pages,
          totalUsers: result.pagination.total,
        })
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError("Failed to load leaderboard data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [pagination.currentPage, timeframe])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }))
    }
  }

  const filteredLeaderboard = searchTerm
    ? leaderboard.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : leaderboard

  // Function to render rank badge with appropriate styling
  const renderRankBadge = (rank: number) => {
    if (rank === 0) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-white drop-shadow-md">
          <Trophy className="h-5 w-5" />
        </div>
      )
    } else if (rank === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-white drop-shadow-sm">
          <Trophy className="h-4 w-4" />
        </div>
      )
    } else if (rank === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
          <Medal className="h-4 w-4" />
        </div>
      )
    } else {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          {rank + 1}
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          {currentUser && (
            <Badge variant="outline" className="bg-green-50 text-green-800">
              <Award className="mr-1 h-3 w-3" />
              {currentUser.points} Points
            </Badge>
          )}
        </div>

        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-green-800">Community Leaderboard</h1>
          
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="my-12 flex items-center justify-center">
              <Trophy className="mr-2 h-6 w-6 animate-pulse text-green-600" />
              <p>Loading leaderboard...</p>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-500">
              <p>{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Try Again
              </Button>
            </Card>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg shadow">
                {filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((user, index) => {
                    const isGold = index === 0;
                    const isSilver = index === 1;
                    const isBronze = index === 2;
                    const isTopThree = index < 3;
                    
                    let rowClasses = "flex items-center justify-between p-4 transition-all";
                    let borderClass = "";
                    
                    if (isGold) {
                      rowClasses += " bg-yellow-50";
                      borderClass = "border-l-4 border-yellow-400";
                    } else if (isSilver) {
                      rowClasses += " bg-gray-50";
                      borderClass = "border-l-4 border-gray-300";
                    } else if (isBronze) {
                      rowClasses += " bg-zinc-50";
                      borderClass = "border-l-4 border-black";
                    } else {
                      rowClasses += " bg-white";
                      borderClass = "border-b";
                    }
                    
                    const avatarBorderClass = isGold ? "border-yellow-400 h-12 w-12" : 
                                              isSilver ? "border-gray-300 h-11 w-11" : 
                                              isBronze ? "border-black h-11 w-11" : 
                                              "border-gray-200 h-10 w-10";
                    
                    const badgeClass = isGold ? "bg-yellow-100 text-yellow-800" : 
                                       isSilver ? "bg-gray-100 text-gray-800" : 
                                       isBronze ? "bg-zinc-100 text-zinc-800" : 
                                       "bg-green-100 text-green-800";
                    
                    return (
                      <div key={user._id} className={`${rowClasses} ${borderClass}`}>
                        <div className="flex items-center gap-4">
                          {renderRankBadge(index)}
                          <Avatar className={`border-2 ${avatarBorderClass}`}>
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className={`font-medium ${isTopThree ? 'text-lg' : ''}`}>{user.name}</span>
                        </div>
                        <Badge className={`${badgeClass} px-3 py-1 text-sm font-semibold`}>
                          {user.totalPoints || user.points} pts
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No users found.</p>
                  </div>
                )}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-2">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}