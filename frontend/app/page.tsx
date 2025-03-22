"use client"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Recycle, RefreshCw, MapPin, Users, Trophy, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthService from "@/lib/auth"
import { useEffect } from "react"

export default function Home() {
  const isLoggedIn = AuthService.isLoggedIn()
  
  // Add smooth scroll behavior when component mounts
  useEffect(() => {
    // Apply custom scrollbar styles
    document.documentElement.classList.add('custom-scrollbar');
    
    return () => {
      // Clean up when component unmounts
      document.documentElement.classList.remove('custom-scrollbar');
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <Recycle className="h-6 w-6 text-green-600" />
        <span className="text-xl font-semibold text-green-800">GreenLens</span>
          </Link>
          <nav className="flex items-center gap-4">
        {isLoggedIn ? (
          <Button asChild variant="ghost" className="hover:bg-green-50  bg-green-400">
            <Link href="/profile" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Profile 
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" className="hover:bg-green-50">
          <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700 shadow-sm">
          <Link href="/auth/register">Get Started</Link>
            </Button>
          </>
        )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-16 md:py-20">
          <div className="absolute inset-0 z-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 800 800">
              <path
                d="M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63"
                stroke="#166534"
                strokeWidth="100"
                fill="none"
              />
            </svg>
          </div>
          <div className="container mx-auto relative z-10 px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Hackathon Project
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-green-900 sm:text-5xl md:text-6xl">
                Make <span className="text-green-600">Eco-Friendly</span> Choices with GreenLens
              </h1>
              <p className="mt-6 text-lg text-gray-600 md:text-xl">
                Your AI-powered guide to reusing and recycling. Upload an item or search for eco-friendly alternatives
                to reduce your environmental footprint.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/get-rid">
                    Get Rid of Something
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/acquire">
                    Acquire Something
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="container mx-auto relative z-10 mt-16 px-4 md:px-6">
            <div className="mx-auto flex max-w-5xl justify-center">
                <div className="relative h-[300px] w-full overflow-hidden rounded-xl shadow-xl sm:h-[400px] md:h-[500px]">
                <video 
                  src="/krix.mp4"
                  autoPlay
                  muted
                  loop
                  style={{ scale: "1.5" }}
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-green-800 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  Powered by AI to identify and suggest sustainable options
                  </div>
                </div>
                </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-green-900 sm:text-4xl">How GreenLens Works</h2>
              <p className="mt-4 text-lg text-gray-600">
                Our platform uses advanced AI to help you make environmentally conscious decisions.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-green-800">Get Rid of Something</h3>
                <p className="mb-4 text-muted-foreground">
                  Upload a photo of your item and get personalized advice on how to reuse or recycle it properly.
                </p>
                <Link
                  href="/get-rid"
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                >
                  Analyze Item
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-green-800">Acquire Something</h3>
                <p className="mb-4 text-muted-foreground">
                  Find eco-friendly alternatives and sustainable options for items you need in your area.
                </p>
                <Link
                  href="/acquire"
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                >
                  Find Alternatives
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-green-800">Join the Community</h3>
                <p className="mb-4 text-muted-foreground">
                  Connect with like-minded individuals, share tips, and learn from others' experiences.
                </p>
                <Link
                  href="/community"
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                >
                  Explore Community
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-green-800">Take Action</h3>
                <p className="mb-4 text-muted-foreground">
                  Complete eco-friendly challenges, earn points, and make a real impact on the environment.
                </p>
                <Link
                  href="/contribute"
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                >
                  Start Contributing
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-green-50 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-bold tracking-tight text-green-900 sm:text-4xl">Hackathon Features</h2>
                <p className="mt-4 text-lg text-gray-600">
                  Explore our latest features designed to enhance your sustainable living journey.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <MapPin className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Interactive Map</h3>
                      <p className="text-sm text-gray-600">
                        Find recycling centers, donation spots, and eco-friendly stores near you.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Users className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Community Forum</h3>
                      <p className="text-sm text-gray-600">
                        Share ideas, tips, and experiences with a community of eco-conscious individuals.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Trophy className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Environmental Quests</h3>
                      <p className="text-sm text-gray-600">
                        Complete eco-friendly challenges and track your real environmental impact.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <BookOpen className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Educational Resources</h3>
                      <p className="text-sm text-gray-600">
                        Access articles, videos, and guides on various aspects of sustainability.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-8">
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/map">
                      Explore Features
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative rounded-xl bg-white p-1 shadow-xl">
                <div className="aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="GreenLens features"
                    width={600}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 rounded-lg bg-green-600 p-4 shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-green-900 sm:text-4xl">
                Join Our Growing Community
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Be part of the solution. Start making sustainable choices today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/contribute">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/community">
                    View Community
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Scroll indicator */}
        <div className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/80 opacity-0 shadow-lg transition-opacity duration-300 hover:bg-green-700" id="scroll-to-top">
          <ArrowRight className="h-5 w-5 rotate-[-90deg] text-white" />
        </div>
      </main>
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Recycle className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold text-green-800">GreenLens</span>
            </div>
            <p className="text-center text-sm text-gray-500">
              Hackathon Project 2025 - Making sustainable choices easier through technology.
            </p>
          </div>
        </div>
      </footer>

      {/* Add scroll behavior script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const scrollToTop = document.getElementById('scroll-to-top');
              
              window.addEventListener('scroll', function() {
                if (window.scrollY > 300) {
                  scrollToTop.style.opacity = '1';
                } else {
                  scrollToTop.style.opacity = '0';
                }
              });
              
              scrollToTop.addEventListener('click', function() {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              });
            });
          `,
        }}
      />
    </div>
  )
}

