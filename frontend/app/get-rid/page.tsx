"use client"
import { useState, useRef, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Loader2, Info, AlertCircle, Recycle, Trash, RefreshCw, MapPin, ExternalLink, Leaf, Share2, Copy, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageService from "@/lib/image"
import AuthService from "@/lib/auth"

export default function GetRidPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Share functionality states
  const [isCopied, setIsCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  // New state for the expanded categories
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({
    reduce: false,
    reuse: false,
    recycle: true  // Default to showing recycle options
  })
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large. Please select an image under 5MB.");
      return;
    }
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Clear previous results and errors
    setResults(null);
    setError(null);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    
    const file = e.dataTransfer.files[0]
    if (!file) return
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.")
      return
    }
    
    // Use the actual FileList from the drop event
    handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>)
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }
  
  const handleCameraCapture = () => {
    // Create a file input and trigger it
    fileInputRef.current?.click()
  }
  
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return
    
    // Check if user is logged in
    if (!AuthService.isLoggedIn()) {
      if (confirm("You need to be logged in to analyze images. Would you like to log in now?")) {
        router.push("/auth/login")
      }
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedImage, selectedImage.name);  // Add filename
      formData.append('context', 'dispose')
      
      const response = await ImageService.analyzeImage(formData)
      
      // Save the result immediately to generate a shareable link
      if (response) {
        // Add the image path to the response
        const responseWithImage = {
          ...response,
          imagePath: response.imagePath || '' // Use existing path if available
        }
        
        // Save to get a shareable ID
        const savedResult = await ImageService.saveDisposalResult(responseWithImage)
        
        // Add the ID to the response object
        response.id = savedResult.id
      }
      
      setResults(response);  // Use direct response since ImageService now handles data extraction
    } catch (err: any) {
      console.error("Error analyzing image:", err)
      setError(err?.detail || "Failed to analyze image. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const resetForm = () => {
    setSelectedImage(null)
    setPreview(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  // Helper to toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Categorize disposal options into the 3Rs: Reduce, Reuse, Recycle
  const categorizeOptions = () => {
    if (!results?.disposalOptions) return { reduce: [], reuse: [], recycle: [] }
    
    return {
      reduce: results.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('reduc') || 
        option.method.toLowerCase().includes('avoid') ||
        option.method.toLowerCase().includes('prevent') ||
        option.description.toLowerCase().includes('reduc')),
      
      reuse: results.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('reus') || 
        option.method.toLowerCase().includes('donat') || 
        option.method.toLowerCase().includes('repair') ||
        option.method.toLowerCase().includes('upcycl') ||
        option.description.toLowerCase().includes('reus')),
      
      recycle: results.disposalOptions.filter((option: any) => 
        option.method.toLowerCase().includes('recycl') || 
        option.method.toLowerCase().includes('compost') ||
        option.method.toLowerCase().includes('dispos') ||
        option.description.toLowerCase().includes('recycl'))
    }
  }

  // Function to handle sharing the analysis result
  const handleShare = async () => {
    if (!results || !results.id) return
    
    setIsSharing(true)
    
    try {
      // Set the URL to be copied to clipboard
      const shareUrl = `${window.location.origin}/get-rid/${results.id}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-full bg-green-100 p-3">
              <Recycle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-800">Get Rid of Something</h1>
            <p className="text-gray-600">
              Find the most sustainable way to dispose of or recycle your items
            </p>
          </div>
          
          <Card className="overflow-hidden">
            {!results ? (
              <>
                <CardHeader>
                  <CardTitle>Upload an Image</CardTitle>
                  <CardDescription>
                    Take or upload a photo of the item you want to dispose of
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {preview ? (
                    <div className="relative mb-4 overflow-hidden rounded-lg border">
                      <Image
                        src={typeof preview === 'string' ? preview : ''}
                        alt="Selected item"
                        width={500}
                        height={300}
                        className="h-64 w-full object-contain"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-2 rounded-full bg-white/80 backdrop-blur-sm"
                        onClick={resetForm}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="mb-4 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-green-300"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <div className="mb-4 rounded-full bg-green-100 p-3">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="mb-2 text-center text-sm text-gray-600">
                        Drag and drop an image here, or click to select
                      </p>
                      <Button 
                        variant="outline" 
                        className="mb-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Select Image
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                      />
                      <p className="text-xs text-gray-500">
                        Supports: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center gap-2 sm:flex-1"
                      onClick={handleCameraCapture}
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button 
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 sm:flex-1"
                      disabled={!selectedImage || isAnalyzing}
                      onClick={handleAnalyzeImage}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Recycle className="h-4 w-4" />
                          Find Disposal Options
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col bg-gray-50 text-center text-sm text-gray-500">
                  <p className="flex items-center justify-center">
                    <Info className="mr-1 h-3 w-3" />
                    Our AI will analyze your item and suggest the most sustainable disposal options
                  </p>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Disposal Options</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetForm}
                      className="gap-1 text-gray-500 hover:text-gray-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                      New Image
                    </Button>
                  </div>
                  <CardDescription>
                    Sustainable ways to dispose of your item
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-lg border">
                      <Image
                        src={typeof preview === 'string' ? preview : ''}
                        alt="Analyzed item"
                        width={300}
                        height={200}
                        className="h-48 w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="mb-2 text-lg font-medium text-green-800">
                        {results.itemName || "Item Analysis"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {results.itemDescription || "Here are the best ways to dispose of this item."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {results.categories?.map((category: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                          <Badge key={index} className="bg-green-100 text-green-800">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
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
                    
                    {(!results.disposalOptions || results.disposalOptions.length === 0) && (
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
                  
                  {results.additionalResources && (
                    <div className="w-full rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                      <p className="flex items-center">
                        <Info className="mr-2 h-4 w-4" />
                        <span className="font-medium">Additional Resources:</span>
                      </p>
                      <p className="mt-1">{results.additionalResources}</p>
                      {results.resourceLink && (
                        <Button 
                          variant="link" 
                          className="mt-1 h-auto p-0 text-blue-600"
                          asChild
                        >
                          <Link href={results.resourceLink} target="_blank" className="flex items-center">
                            Learn More <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Share button */}
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Share Analysis
                      </>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
          
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-gray-600">
              Looking to acquire something new instead?
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/acquire">
                <Leaf className="h-4 w-4" />
                Find Sustainable Alternatives
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

