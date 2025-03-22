"use client"
import { useState, useRef, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Loader2, Info, AlertCircle, Recycle, Trash, RefreshCw, MapPin, ExternalLink, Leaf } from "lucide-react"
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
      setResults(response);  // Use direct response since ImageService now handles data extraction
    } catch (err: any) {
      console.error("Error analyzing image:", err)
      setError(err.detail || "Failed to analyze image. Please try again.")
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
                  
                  <div className="mt-6 space-y-6">
                    {results.disposalOptions?.map((option: { method: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; steps: any[]; environmentalImpact: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }, index: Key | null | undefined) => (
                      <div key={index} className={`rounded-lg border p-4 ${index === 0 ? 'border-green-200 bg-green-50' : ''}`}>
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className={`text-lg font-medium ${index === 0 ? 'text-green-800' : 'text-gray-800'}`}>
                            {option.method}
                            {index === 0 && (
                              <Badge className="ml-2 bg-green-600">Recommended</Badge>
                            )}
                          </h3>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">{option.description}</p>
                        {option.steps && (
                          <div className="mb-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">How to do it:</h4>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                              {option.steps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {option.environmentalImpact && (
                          <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700">
                            <h4 className="mb-1 font-medium">Environmental Impact</h4>
                            <p>{option.environmentalImpact}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    
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

