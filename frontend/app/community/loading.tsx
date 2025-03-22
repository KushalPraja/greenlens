import { Trophy } from "lucide-react"

export default function LeaderboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <Trophy className="mx-auto h-12 w-12 animate-pulse text-green-600" />
        <h1 className="mt-4 text-xl font-medium text-green-800">Loading leaderboard...</h1>
        <p className="mt-2 text-sm text-gray-500">
          We're fetching the latest sustainability champions
        </p>
      </div>
    </div>
  )
}

