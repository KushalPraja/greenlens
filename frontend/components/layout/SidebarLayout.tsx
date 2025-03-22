'use client'
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Users, Trophy, User, LogOut, Trash2, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import AuthService from "@/lib/auth"

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        setUserData(user)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    if (AuthService.isLoggedIn()) {
      fetchUserData()
    }
  }, [])

  const handleLogout = async () => {
    await AuthService.logout()
    router.push('/auth/login')
  }
  
  const navigation = [
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Get Rid', href: '/get-rid', icon: Trash2 },
    { name: 'Acquire', href: '/acquire', icon: ShoppingBag },
    { name: 'Contribute', href: '/contribute', icon: Trophy },
    { name: 'My Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="flex h-screen">
      <div className="hidden w-64 flex-shrink-0 border-r bg-white md:block">
        <div className="flex h-full flex-col">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-green-600">GreenLens</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-green-50 text-green-600"
                        : "text-gray-600 hover:bg-gray-50",
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? "text-green-600"
                          : "text-gray-400 group-hover:text-gray-500",
                        "mr-3 h-5 w-5 flex-shrink-0"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User info and logout section */}
          {userData && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex flex-col space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{userData.name}</p>
                  <p className="text-xs text-gray-500">{userData.points || 0} points</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
