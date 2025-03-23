"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Info, AlertCircle, Recycle, MapPin, ExternalLink, Leaf, Share2, Copy, CheckCheck, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ImageService from "@/lib/image"

export default function DisposalResultPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [expandedCategories, setExpandedCategories] = useState({
    reduce: false,
    reuse: false,
    recycle: true  // Default to showing recycle options
  })
  
  // Share functionality states
  const [isCopied, setIsCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showQr, setShowQr] = useState(false)
  
  useEffect(() => {
    const fetchResult = async () => {
      if (!params.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        const data = await ImageService.getDisposalResult(params.id as string)
        setResult(data)
      } catch (err: any) {
        console.error("Error fetching disposal result:", err)
        setError(err.detail || "Failed to load disposal result. It may have been removed or doesn't exist.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchResult()
  }, [params.id])
  
  // Helper to toggle category expansion
  const toggleCategory = (category: 'reduce' | 'reuse' | 'recycle') => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Categorize disposal options into the 3Rs: Reduce, Reuse, Recycle
  const categorizeOptions = () => {
    if (!result?.disposalOptions) return { reduce: [], reuse: [], recycle: [] }
    
    return {
      reduce: result.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('reduc') || 
        option.method.toLowerCase().includes('avoid') ||
        option.method.toLowerCase().includes('prevent') ||
        option.description.toLowerCase().includes('reduc')),
      
      reuse: result.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('reus') || 
        option.method.toLowerCase().includes('donat') || 
        option.method.toLowerCase().includes('repair') ||
        option.method.toLowerCase().includes('upcycl') ||
        option.description.toLowerCase().includes('reus')),
      
      recycle: result.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('recycl') || 
        option.method.toLowerCase().includes('compost') ||
        option.method.toLowerCase().includes('dispos') ||
        option.description.toLowerCase().includes('recycl'))
    }
  }
  
  // Function to handle sharing the analysis result
  const handleShare = async () => {
    setIsSharing(true)
    
    try {
      // Copy the current URL to clipboard
      await navigator.clipboard.writeText(window.location.href)
      
      // Indicate success
      setIsCopied(true)
      
      // Reset the copied status after 3 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 3000)
    } catch (err) {
      console.error("Error sharing analysis:", err)
    } finally {
      setIsSharing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
          <h1 className="mt-4 text-xl font-medium text-green-800">Loading disposal result...</h1>
          <p className="mt-2 text-sm text-gray-500">
            Retrieving sustainable disposal information
          </p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-medium text-red-800">Error Loading Result</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Button
            asChild
            className="mt-6 bg-green-600 hover:bg-green-700"
          >
            <Link href="/get-rid">Return to Get Rid Page</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/get-rid" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Get Rid
          </Link>
        </div>
        
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-full bg-green-100 p-3">
              <Recycle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-800">Disposal Recommendations</h1>
            <p className="text-gray-600">
              Sustainable ways to dispose of this item
            </p>
          </div>
          
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Disposal Options for {result?.itemName}</CardTitle>
              <CardDescription>
                Follow the 3Rs hierarchy for the most sustainable approach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {result?.imagePath && (
                  <div className="overflow-hidden rounded-lg border">
                    <Image
                      src={`https://greenv4.wittyhill-45f93eb6.canadaeast.azurecontainerapps.io/${result.imagePath.replace(/^\.\//, '')}`}
                      alt={result.itemName || "Analyzed item"}
                      width={300}
                      height={200}
                      className="h-48 w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <h3 className="mb-2 text-lg font-medium text-green-800">
                    {result?.itemName || "Item Analysis"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result?.itemDescription || "Here are the best ways to dispose of this item."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result?.categories?.map((category: string, index: number) => (
                      <Badge key={index} className="bg-green-100 text-green-800">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {showQr && result?.qrCode && (
                <div className="mb-6 flex flex-col items-center justify-center rounded-lg border bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-green-800">Scan to Share</h3>
                  <div className="mb-4 overflow-hidden rounded-lg border p-2">
                    <img 
                      src={result.qrCode} 
                      alt="QR Code" 
                      className="h-52 w-52"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Scan this QR code to share these disposal recommendations
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowQr(false)}
                  >
                    Hide QR Code
                  </Button>
                </div>
              )}
              
              {/* 3Rs Tree Structure */}
              <div className="mb-6 rounded-lg border bg-green-50/50 p-4">
                <h3 className="mb-2 text-lg font-medium text-green-800">Sustainable Hierarchy</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Follow the 3Rs hierarchy for the most sustainable approach: Reduce → Reuse → Recycle
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {/* Categorized options using our helper function */}
                {(() => {
                  const categorized = categorizeOptions();
                  return (
                    <>
                      {/* REDUCE section */}
                      <div className="rounded-lg border shadow-sm">
                        <button
                          onClick={() => toggleCategory('reduce')}
                          className={`flex w-full items-center justify-between rounded-t-lg p-4 text-left ${
                            expandedCategories.reduce ? 'bg-green-100' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
                              <span className="text-sm font-semibold text-green-800">1</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-green-800">Reduce</h3>
                              <p className="text-xs text-gray-600">Best option: Avoid waste creation</p>
                            </div>
                          </div>
                          <div className="text-green-600">
                            {expandedCategories.reduce ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        {expandedCategories.reduce && (
                          <div className="p-4">
                            {categorized.reduce.length > 0 ? (
                              <div className="space-y-3">
                                {categorized.reduce.map((option: any, index: number) => (
                                  <div key={index} className="rounded-lg border bg-white p-4">
                                    <h4 className="mb-2 font-medium text-green-800">{option.method}</h4>
                                    <p className="mb-3 text-sm text-gray-600">{option.description}</p>
                                    {option.steps && option.steps.length > 0 && (
                                      <div className="mb-3">
                                        <h5 className="mb-1 text-xs font-medium text-gray-700">How to do it:</h5>
                                        <ul className="ml-5 list-disc space-y-1 text-xs text-gray-600">
                                          {option.steps.map((step: string, stepIndex: number) => (
                                            <li key={stepIndex}>{step}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {option.environmentalImpact && (
                                      <div className="rounded border-l-4 border-green-500 bg-green-50 p-2 text-xs text-green-800">
                                        <span className="font-medium">Environmental Impact:</span> {option.environmentalImpact}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg border bg-white p-4 text-center">
                                <p className="text-sm text-gray-500">No reduce options available for this item.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* REUSE section */}
                      <div className="rounded-lg border shadow-sm">
                        <button
                          onClick={() => toggleCategory('reuse')}
                          className={`flex w-full items-center justify-between rounded-t-lg p-4 text-left ${
                            expandedCategories.reuse ? 'bg-blue-100' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200">
                              <span className="text-sm font-semibold text-blue-800">2</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-blue-800">Reuse</h3>
                              <p className="text-xs text-gray-600">Better option: Give item a second life</p>
                            </div>
                          </div>
                          <div className="text-blue-600">
                            {expandedCategories.reuse ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        {expandedCategories.reuse && (
                          <div className="p-4">
                            {categorized.reuse.length > 0 ? (
                              <div className="space-y-3">
                                {categorized.reuse.map((option: any, index: number) => (
                                  <div key={index} className="rounded-lg border bg-white p-4">
                                    <h4 className="mb-2 font-medium text-blue-800">{option.method}</h4>
                                    <p className="mb-3 text-sm text-gray-600">{option.description}</p>
                                    {option.steps && option.steps.length > 0 && (
                                      <div className="mb-3">
                                        <h5 className="mb-1 text-xs font-medium text-gray-700">How to do it:</h5>
                                        <ul className="ml-5 list-disc space-y-1 text-xs text-gray-600">
                                          {option.steps.map((step: string, stepIndex: number) => (
                                            <li key={stepIndex}>{step}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {option.environmentalImpact && (
                                      <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-2 text-xs text-blue-800">
                                        <span className="font-medium">Environmental Impact:</span> {option.environmentalImpact}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg border bg-white p-4 text-center">
                                <p className="text-sm text-gray-500">No reuse options available for this item.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* RECYCLE section */}
                      <div className="rounded-lg border shadow-sm">
                        <button
                          onClick={() => toggleCategory('recycle')}
                          className={`flex w-full items-center justify-between rounded-t-lg p-4 text-left ${
                            expandedCategories.recycle ? 'bg-amber-100' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200">
                              <span className="text-sm font-semibold text-amber-800">3</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-amber-800">Recycle</h3>
                              <p className="text-xs text-gray-600">Last resort: Process and transform material</p>
                            </div>
                          </div>
                          <div className="text-amber-600">
                            {expandedCategories.recycle ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        {expandedCategories.recycle && (
                          <div className="p-4">
                            {categorized.recycle.length > 0 ? (
                              <div className="space-y-3">
                                {categorized.recycle.map((option: any, index: number) => (
                                  <div key={index} className="rounded-lg border bg-white p-4">
                                    <h4 className="mb-2 font-medium text-amber-800">{option.method}</h4>
                                    <p className="mb-3 text-sm text-gray-600">{option.description}</p>
                                    {option.steps && option.steps.length > 0 && (
                                      <div className="mb-3">
                                        <h5 className="mb-1 text-xs font-medium text-gray-700">How to do it:</h5>
                                        <ul className="ml-5 list-disc space-y-1 text-xs text-gray-600">
                                          {option.steps.map((step: string, stepIndex: number) => (
                                            <li key={stepIndex}>{step}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {option.environmentalImpact && (
                                      <div className="rounded border-l-4 border-amber-500 bg-amber-50 p-2 text-xs text-amber-800">
                                        <span className="font-medium">Environmental Impact:</span> {option.environmentalImpact}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg border bg-white p-4 text-center">
                                <p className="text-sm text-gray-500">No recycling options available for this item.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
                
                {(!result?.disposalOptions || result.disposalOptions.length === 0) && (
                  <div className="rounded-lg border p-6 text-center">
                    <Recycle className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                    <h3 className="mb-2 text-lg font-medium text-gray-600">No specific disposal options found</h3>
                    <p className="text-sm text-gray-500">
                      Try uploading a clearer image or check your local recycling guidelines.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4 bg-gray-50">
              <Button 
                asChild 
                variant="outline" 
                className="w-full gap-2"
              >
                <Link href="/map">
                  <MapPin className="h-4 w-4" />
                  Find Nearby Recycling Centers
                </Link>
              </Button>
              
              {result?.additionalResources && (
                <div className="w-full rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    <span className="font-medium">Additional Resources:</span>
                  </p>
                  <p className="mt-1">{result.additionalResources}</p>
                  {result.resourceLink && (
                    <Button 
                      variant="link" 
                      className="mt-1 h-auto p-0 text-blue-600"
                      asChild
                    >
                      <Link href={result.resourceLink} target="_blank" className="flex items-center">
                        Learn More <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {/* Share and QR code buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  {isCopied ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowQr(!showQr)}
                >
                  <QrCode className="h-4 w-4" />
                  {showQr ? "Hide QR" : "Show QR"}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-gray-600">
              Want to analyze something else?
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/get-rid">
                <Recycle className="h-4 w-4" />
                Analyze Another Item
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}