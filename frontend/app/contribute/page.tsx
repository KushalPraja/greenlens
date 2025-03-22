"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Trophy,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
  Award,
  Leaf,
  Car,
  Droplets,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import AuthService from "@/lib/auth"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import PointsService from "@/lib/points"

interface Quest {
  id: string  // Changed from _id to id
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  pointsAwarded: number
  category: string
  environmentalImpact: string
  carbonSaved: number
  waterSaved: number
  wastePrevented: number
  status: string
  assignedTo: string | null
  createdAt: string
}

interface ActiveQuest extends Quest {
  questId: string
  userId: string
  status: string
  assignedAt: string
  completedAt?: string
  proofImagePath?: string
  questDetails?: Quest
}

interface ImpactStats {
  total_quests_completed: number
  total_points_earned: number
  total_carbon_saved_kg: number
  total_water_saved_liters: number
  total_waste_prevented_kg: number
  impact_comparisons: string[]
}

interface QuestImageState {
  image: File | null;
  preview: string | null;
}

export default function ContributePage() {
  const router = useRouter()
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([])
  const [activeQuests, setActiveQuests] = useState<ActiveQuest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questImages, setQuestImages] = useState<{ [key: string]: QuestImageState }>({});
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!AuthService.isLoggedIn()) {
      router.push("/auth/login")
      return
    }

    fetchQuests()
    fetchImpactStats()
  }, [router])

  const fetchQuests = async () => {
    try {
      const [availableRes, activeRes] = await Promise.all([
        PointsService.getAvailableQuests(),
        PointsService.getActiveQuests()
      ]);

      setAvailableQuests(availableRes || []);
      setActiveQuests(activeRes || []);
    } catch (err) {
      console.error("Error fetching quests:", err);
      setError("Failed to load quests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImpactStats = async () => {
    try {
        const response = await PointsService.getEnvironmentalImpact()
        setImpactStats(response || null)
    } catch (err) {
        console.error("Error fetching impact stats:", err)
    }
  }

  const acceptQuest = async (questId: string) => {
    if (activeQuests.length >= 5) {
        toast("Maximum Quests Reached", {
            description: "Complete some of your active quests before accepting new ones."
        })
        return
    }

    setIsAccepting(true)
    try {
        const response = await PointsService.assignQuest(questId)
        
        toast("Quest Accepted!", {
            description: "The quest has been added to your active quests."
        })

        fetchQuests() // Refresh quests
    } catch (err) {
        console.error("Error accepting quest:", err)
        toast("Failed to Accept Quest", {
            description: "Please try again later."
        })
    } finally {
        setIsAccepting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const questId = e.target.id.replace('proof-', '');
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("File Too Large", {
        description: "Please select an image under 5MB."
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast("Invalid File Type", {
        description: "Please select an image file."
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setQuestImages(prev => ({
          ...prev,
          [questId]: {
            image: file,
            preview: result
          }
        }));
        // Auto-submit the quest proof when image is selected
        submitQuestProof(questId, file);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitQuestProof = async (questId: string, image: File) => {
    setIsSubmitting(true);

    try {
      const response = await PointsService.completeQuest(questId, image, null);
      
      if (!response) {
        toast.error("Failed to submit proof. Please try again.");
        return;
      }

      // Success notification with points earned
      toast.success("Quest completion submitted!", {
        description: `You earned ${response.points_awarded || 0} points!`
      });
      
      // Clear only the submitted quest's image
      setQuestImages(prev => {
        const newState = { ...prev };
        delete newState[questId];
        return newState;
      });

      // Refresh quests and stats
      await Promise.all([
        fetchQuests(),
        fetchImpactStats(),
        AuthService.getCurrentUser() // This will update the user's points in the app state
      ]);

    } catch (err: any) {
      console.error("Error submitting proof:", err);
      toast.error("Failed to submit proof", {
        description: err.message || "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return "gray"; // Default color for undefined values

    switch (difficulty.toLowerCase()) {
    case "easy":
        return "green";
    case "medium":
        return "orange";
    case "hard":
        return "red";
    default:
        return "gray";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-full bg-green-100 p-3">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-800">Environmental Quests</h1>
            <p className="text-gray-600">
              Complete eco-friendly challenges to earn points and make a real impact
            </p>
          </div>

          {impactStats && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Environmental Impact</CardTitle>
                <CardDescription>
                  The difference you've made through completed quests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4 text-center">
                    <Car className="mx-auto mb-2 h-6 w-6 text-green-600" />
                    <p className="text-2xl font-bold text-green-800">
                      {impactStats.total_carbon_saved_kg.toFixed(1)} kg
                    </p>
                    <p className="text-sm text-gray-600">CO2 Saved</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <Droplets className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-800">
                      {impactStats.total_water_saved_liters.toFixed(1)} L
                    </p>
                    <p className="text-sm text-gray-600">Water Saved</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <Trash2 className="mx-auto mb-2 h-6 w-6 text-amber-600" />
                    <p className="text-2xl font-bold text-amber-800">
                      {impactStats.total_waste_prevented_kg.toFixed(1)} kg
                    </p>
                    <p className="text-sm text-gray-600">Waste Prevented</p>
                  </div>
                </div>

                {impactStats.impact_comparisons.length > 0 && (
                  <div className="mt-4 rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-800">Impact Comparisons</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-green-700">
                      {impactStats.impact_comparisons.map((comparison, index) => (
                        <li key={index}>{comparison}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="available">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Quests</TabsTrigger>
              <TabsTrigger value="active">Active Quests ({activeQuests.length}/5)</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-6">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Trophy className="mr-2 h-6 w-6 animate-pulse text-green-600" />
                    <p>Loading quests...</p>
                  </div>
                ) : error ? (
                  <Card className="p-6 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                    <p>{error}</p>
                    <Button onClick={fetchQuests} className="mt-4">
                      Try Again
                    </Button>
                  </Card>
                ) : availableQuests.length > 0 ? (
                  availableQuests.map((quest) => (
                    <Card key={quest.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{quest.title}</CardTitle>
                            <CardDescription>{quest.description}</CardDescription>
                          </div>
                          <Badge className={getDifficultyColor(quest.difficulty)}>
                            {quest.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-green-50">
                            {quest.category}
                          </Badge>
                          <Badge variant="outline" className="bg-amber-50">
                            +{quest.pointsAwarded} points
                          </Badge>
                        </div>
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                          <h4 className="mb-1 font-medium">Environmental Impact</h4>
                          <p>{quest.environmentalImpact}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-between">
                        <Button
                          onClick={() => acceptQuest(quest.id)}
                          disabled={isAccepting || activeQuests.length >= 5}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isAccepting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <Trophy className="mr-2 h-4 w-4" />
                              Accept Quest
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <Leaf className="mx-auto mb-3 h-10 w-10 text-green-200" />
                    <h3 className="mb-2 text-lg font-medium">No Quests Available</h3>
                    <p className="text-sm text-gray-500">
                      Check back later for new environmental challenges
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <div className="space-y-4">
                {activeQuests.length > 0 ? (
                  activeQuests.map((quest) => (
                    <Card key={quest.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{quest.questDetails?.title || 'Loading...'}</CardTitle>
                            <CardDescription>{quest.questDetails?.description || ''}</CardDescription>
                          </div>
                          <Badge className={getDifficultyColor(quest.questDetails?.difficulty)}>
                            {quest.questDetails?.difficulty || 'Unknown'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-green-50">
                            {quest.questDetails?.category || 'Misc'}
                          </Badge>
                          <Badge variant="outline" className="bg-amber-50">
                            +{quest.questDetails?.pointsAwarded || 0} points
                          </Badge>
                        </div>

                        {questImages[quest.id]?.preview ? (
                          <div className="mt-4">
                            <div className="relative mb-2 overflow-hidden rounded-lg border">
                              <Image
                                src={questImages[quest.id]?.preview || ''}
                                alt="Proof preview"
                                width={400}
                                height={300}
                                className="h-48 w-full object-contain"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2"
                                onClick={() => {
                                  setQuestImages(prev => {
                                    const newState = { ...prev };
                                    delete newState[quest.id];
                                    return newState;
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById(`proof-${quest.id}`)?.click()}
                              className="w-full"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Take Photo
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById(`proof-${quest.id}`)?.click()}
                              className="w-full"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </Button>
                            <input
                              type="file"
                              id={`proof-${quest.id}`}
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <Trophy className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                    <h3 className="mb-2 text-lg font-medium">No Active Quests</h3>
                    <p className="text-sm text-gray-500">
                      Accept quests from the available tab to get started
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}