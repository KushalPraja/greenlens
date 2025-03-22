"use client"
import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Loader2, Info, AlertCircle, Leaf, Trash, RefreshCw, Search, MapPin, Recycle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageService from "@/lib/image"
import AuthService from "@/lib/auth"

export default function AcquirePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Text search state
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Added reflection step state
  const [showReflection, setShowReflection] = useState(false)
  const [needsProduct, setNeedsProduct] = useState(false)
  const [needsNewItem, setNeedsNewItem] = useState(false)
  const [reflectionComplete, setReflectionComplete] = useState(false)
  const [analyzedItem, setAnalyzedItem] = useState<string>("")
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
    const reader: FileReader = new FileReader();
    reader.onloadend = (): void => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    }
    reader.readAsDataURL(file);
    
    // Clear previous results and errors
    setResults(null);
    setError(null);
  }
  
  const handleDrop = (e: any) => {
    e.preventDefault()
    
    const file = e.dataTransfer.files[0]
    if (!file) return
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.")
      return
    }
    
    // Process the file directly
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large. Please select an image under 5MB.");
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader: FileReader = new FileReader();
    reader.onloadend = (): void => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    }
    reader.readAsDataURL(file);
    
    // Clear previous results and errors
    setResults(null);
    setError(null);
  }
  
  const handleCameraCapture = () => {
    // Create a file input and trigger it
    fileInputRef.current?.click()
  }
  
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    
    // Check if user is logged in
    if (!AuthService.isLoggedIn()) {
      if (confirm("You need to be logged in to analyze images. Would you like to log in now?")) {
        router.push("/auth/login");
      }
      return;
    }
    
    // Set show reflection flag instead of immediately analyzing
    setShowReflection(true);
    
    // Try to identify what's in the image to provide context
    try {
      const formData = new FormData();
      formData.append('file', selectedImage, selectedImage.name);
      formData.append('context', 'identify');
      
      const response = await ImageService.identifyImage(formData);
      if (response && response.itemName) {
        setAnalyzedItem(response.itemName);
      }
    } catch (err) {
      console.error("Error identifying image:", err);
      setAnalyzedItem("this product");
    }
  }
  
  const handleReflectionComplete = async () => {
    if (needsProduct && needsNewItem) {
      // User confirmed they need this product and it needs to be new
      setReflectionComplete(true);
      setIsAnalyzing(true);
      setError(null);
      
      try {
        const formData = new FormData();
        formData.append('file', selectedImage!, selectedImage!.name);
        formData.append('context', 'acquire');
        
        const response = await ImageService.analyzeImage(formData);
        
        // Handle the response properly
        let processedResponse = { ...response };
        
        // Check if the response has the new sustainableAlternatives format
        if (response.sustainableAlternatives && response.sustainableAlternatives.length > 0) {
          // Already in the correct format, just need to map to our frontend structure
          processedResponse = {
            itemName: response.itemName || "Analyzed Item",
            itemDescription: response.itemDescription || "Here are sustainable alternatives",
            suggestions: response.sustainableAlternatives.map((alt: any) => ({
              name: alt.productName,
              description: alt.description,
              environmentalBenefits: alt.environmentalBenefits,
              whereToBuy: alt.whereToBuy,
              priceRange: alt.priceRange,
              sustainabilityFeatures: alt.sustainabilityFeatures
            }))
          };
        } 
        // Fallback to the old format if needed
        else if (response.disposalOptions && response.disposalOptions.length > 0) {
          processedResponse = {
            itemName: response.itemName || "Analyzed Item",
            itemDescription: response.itemDescription || "Here are sustainable alternatives",
            suggestions: response.disposalOptions.map((option: any) => ({
              name: option.method,
              description: option.description,
              environmentalBenefits: option.environmentalImpact,
              steps: option.steps,
              additionalInfo: option.additionalResources
            }))
          };
        }
        
        setResults(processedResponse);
      } catch (err: any) {
        console.error("Error analyzing image:", err);
        setError(err.detail || "Failed to analyze image. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // User decided they don't need this product or it doesn't need to be new
      // Show alternative suggestions based on their choices
      setReflectionComplete(true);
      setResults({
        itemName: "Sustainable Decision",
        itemDescription: !needsProduct ? 
          "You've made a sustainable choice by reconsidering your purchase." : 
          "You've made a sustainable choice by considering second-hand options.",
        suggestions: [{
          name: !needsProduct ? "Reduce Consumption" : "Reuse Options",
          description: !needsProduct ? 
            "By choosing not to purchase unnecessary items, you're helping reduce waste and resource consumption." : 
            "By choosing second-hand or refurbished items, you're extending product lifecycles and reducing waste.",
          environmentalBenefits: !needsProduct ?
            "Reducing consumption: Decreases resource extraction, manufacturing emissions, packaging waste, and eventual disposal impacts." :
            "Choosing second-hand: Reduces demand for new products, saves manufacturing energy, and keeps usable items out of landfills.",
          steps: !needsProduct ? 
            ["Consider if you can repurpose items you already own", "Borrow or rent items for temporary needs", "Practice mindful consumption"] :
            ["Check local thrift stores and second-hand marketplaces", "Look for refurbished options", "Join local buy-nothing groups"],
          additionalInfo: !needsProduct ?
            "Visit our Learn section for tips on minimalist living and sustainable consumption." :
            "Check out our Map section to find local thrift stores and donation centers."
        }]
      });
    }
  }
  
  const handleTextSearch = async (e:any) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search term")
      return
    }
    
    // Check if user is logged in
    if (!AuthService.isLoggedIn()) {
      if (confirm("You need to be logged in to search. Would you like to log in now?")) {
        router.push("/auth/login")
      }
      return
    }
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      const searchData = {
        query: searchQuery.trim(),
        location: location.trim() || undefined,
        category: 'sustainable'
      }
      
      const response = await ImageService.findLocalProducts(searchData)
      setSearchResults(response)
    } catch (err) {
      console.error("Error searching for products:", err)
      setSearchError("Failed to search for products. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }
  
  const resetUploadForm = () => {
    setSelectedImage(null)
    setPreview(null)
    setResults(null)
    setError(null)
    setShowReflection(false)
    setNeedsProduct(false)
    setNeedsNewItem(false)
    setReflectionComplete(false)
    setAnalyzedItem("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  const resetSearchForm = () => {
    setSearchQuery("")
    setLocation("")
    setSearchResults(null)
    setSearchError(null)
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
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-800">Find Eco-Friendly Alternatives</h1>
            <p className="text-gray-600">
              Discover sustainable products that are better for the environment
            </p>
          </div>
          
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              <TabsTrigger value="search">Search Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card className="overflow-hidden">
                {!results ? (
                  <>
                    <CardHeader>
                      <CardTitle>Upload Product Image</CardTitle>
                      <CardDescription>
                        Take or upload a photo of a product to find eco-friendly alternatives
                      </CardDescription>
                    </CardHeader>
                    {!showReflection ? (
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
                              src={preview || ""}
                              alt="Selected product"
                              width={500}
                              height={300}
                              className="h-64 w-full object-contain"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-2 rounded-full p-1"
                              onClick={resetUploadForm}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="mb-4 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-green-300"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            <p className="mb-2 text-center text-sm text-gray-500">
                              Drag and drop a product image here, or click to select
                            </p>
                            <Button 
                              variant="outline" 
                              className="mb-2"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
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
                                Finding Alternatives...
                              </>
                            ) : (
                              <>
                                <Leaf className="h-4 w-4" />
                                Find Eco-Alternatives
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent>
                        <div className="space-y-6">
                          <div className="rounded-lg border bg-green-50 p-4">
                            <h3 className="mb-2 text-lg font-medium text-green-800">Consumption Reflection</h3>
                            <p className="mb-4 text-sm text-gray-700">
                              Before suggesting alternatives, let's consider sustainable consumption principles.
                              Please reflect on the following questions:
                            </p>
                            
                            <div className="space-y-4">
                              <div className="flex items-start space-x-2">
                                <div className="mt-1">
                                  <input 
                                    type="checkbox" 
                                    id="needsProduct" 
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={needsProduct}
                                    onChange={(e) => setNeedsProduct(e.target.checked)}
                                  />
                                </div>
                                <div>
                                  <label htmlFor="needsProduct" className="block text-sm font-medium text-gray-700">
                                    Do you really need {analyzedItem || "this product"}?
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    The most sustainable choice is often to avoid unnecessary purchases (Reduce).
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-2">
                                <div className="mt-1">
                                  <input 
                                    type="checkbox" 
                                    id="needsNewItem" 
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={needsNewItem}
                                    onChange={(e) => setNeedsNewItem(e.target.checked)}
                                  />
                                </div>
                                <div>
                                  <label htmlFor="needsNewItem" className="block text-sm font-medium text-gray-700">
                                    Do you need to get a new item?
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    Consider second-hand, borrowing, or repairing existing items (Reuse).
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleReflectionComplete}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Continue
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={resetUploadForm}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    )}
                    <CardFooter className="flex flex-col bg-gray-50 text-center text-sm text-gray-500">
                      <p className="flex items-center justify-center">
                        <Info className="mr-1 h-3 w-3" />
                        {!showReflection ? 
                          "Your image will be analyzed by our AI to suggest sustainable alternatives" :
                          "Sustainable consumption follows the principle: Reduce → Reuse → Recycle"
                        }
                      </p>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Sustainable Alternatives</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={resetUploadForm}
                          className="gap-1 text-gray-500 hover:text-gray-700"
                        >
                          <RefreshCw className="h-4 w-4" />
                          New Search
                        </Button>
                      </div>
                      <CardDescription>
                        Eco-friendly alternatives to the product you uploaded
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
                          {results.itemName || "Analyzed Product"}
                        </h3>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Here are eco-friendly alternatives to consider:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                              <Badge className="bg-green-100 text-green-800">Sustainable</Badge>
                              <Badge className="bg-blue-100 text-blue-800">Reusable</Badge>
                              <Badge className="bg-amber-100 text-amber-800">Eco-Friendly</Badge>
                        </div>
                      </div>
                    </div>
                    
                      <div className="space-y-4">
                        {results?.suggestions?.map((suggestion:any, index:any) => (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="mb-2 flex items-start justify-between">
                              <h3 className="text-lg font-medium text-green-800">{suggestion.name}</h3>
                              {suggestion.priceRange && (
                                <Badge variant="outline" className="bg-gray-50">
                                  {suggestion.priceRange}
                                </Badge>
                              )}
                            </div>
                            <p className="mb-3 text-sm text-gray-600">{suggestion.description}</p>
                            
                            {/* Where to buy section */}
                            {suggestion.whereToBuy && suggestion.whereToBuy.length > 0 && (
                              <div className="mb-3">
                                <h4 className="mb-2 text-sm font-medium text-gray-700">Available At:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(suggestion.whereToBuy) ? (
                                    suggestion.whereToBuy.map((store: string, storeIndex: number) => (
                                      <Badge key={storeIndex} variant="outline" className="bg-blue-50">
                                        {store}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-600">{suggestion.whereToBuy}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Fallback to steps if whereToBuy is not available */}
                            {!suggestion.whereToBuy && suggestion.steps && suggestion.steps.length > 0 && (
                              <div className="mb-3">
                                <h4 className="mb-2 text-sm font-medium text-gray-700">How to Find:</h4>
                                <ul className="ml-5 list-disc space-y-1 text-sm text-gray-600">
                                  {suggestion.steps.map((step: string, stepIndex: number) => (
                                    <li key={stepIndex}>{step}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Sustainability features */}
                            {suggestion.sustainabilityFeatures && suggestion.sustainabilityFeatures.length > 0 && (
                              <div className="mb-3">
                                <h4 className="mb-2 text-sm font-medium text-gray-700">Key Features:</h4>
                                <ul className="ml-5 list-disc space-y-1 text-sm text-gray-600">
                                  {suggestion.sustainabilityFeatures.map((feature: string, featureIndex: number) => (
                                    <li key={featureIndex}>{feature}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Environmental benefits */}
                            {suggestion.environmentalBenefits && (
                              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                <h4 className="mb-1 font-medium">Environmental Benefits</h4>
                                <p>{suggestion.environmentalBenefits}</p>
                              </div>
                            )}
                            
                            {/* Additional info */}
                            {suggestion.additionalInfo && (
                              <div className="mt-3 text-xs text-gray-500">
                                <p>{suggestion.additionalInfo}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {(!results?.suggestions || results.suggestions.length === 0) && (
                          <div className="rounded-lg border p-6 text-center">
                            <Leaf className="mx-auto mb-3 h-10 w-10 text-green-200" />
                            <h3 className="mb-2 text-lg font-medium text-gray-600">No specific alternatives found</h3>
                            <p className="text-sm text-gray-500">
                              Try uploading a clearer image or use our search feature to find eco-friendly products.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col space-y-4 bg-gray-50">
                      <div className="w-full rounded-lg bg-green-50 p-3 text-sm text-green-800">
                        <p className="flex items-center">
                          <Info className="mr-2 h-4 w-4" />
                          Look for certifications like Fair Trade, USDA Organic, or Energy Star when buying sustainable products.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setActiveTab("search")} 
                        variant="outline" 
                        className="w-full gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Search for more alternatives
                      </Button>
                    </CardFooter>
                  </>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="search">
              <Card className="overflow-hidden">
                {!searchResults ? (
                  <>
                    <CardHeader>
                      <CardTitle>Search Eco-Friendly Products</CardTitle>
                      <CardDescription>
                        Find sustainable alternatives to everyday products
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {searchError && (
                        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          <span>{searchError}</span>
                        </div>
                      )}
                      
                      <form onSubmit={handleTextSearch} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="searchQuery" className="text-sm font-medium">
                            What are you looking for?
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="searchQuery"
                              placeholder="e.g., water bottle, coffee cup, cleaning products"
                              className="pl-9"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="location" className="text-sm font-medium">
                            Your Location (optional)
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="location"
                              placeholder="e.g., Chicago, IL"
                              className="pl-9"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Adding your location helps us find products available near you
                          </p>
                        </div>
                        
                        <Button 
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!searchQuery.trim() || isSearching}
                        >
                          {isSearching ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Find Sustainable Products
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                    <CardFooter className="flex flex-col bg-gray-50 text-center text-sm text-gray-500">
                      <p className="flex items-center justify-center">
                        <Info className="mr-1 h-3 w-3" />
                        Our AI will help you find eco-friendly alternatives available in your area
                      </p>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Search Results</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={resetSearchForm}
                          className="gap-1 text-gray-500 hover:text-gray-700"
                        >
                          <RefreshCw className="h-4 w-4" />
                          New Search
                        </Button>
                      </div>
                      <CardDescription>
                        Eco-friendly alternatives for "{searchQuery}"
                        {location && ` near ${location}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {searchResults?.products?.map((product: any, index: any) => (
                          <div key={index} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="text-lg font-medium text-green-800">{product.name}</h3>
                          <Badge variant="outline" className="bg-gray-50">
                            {product.price}
                          </Badge>
                            </div>
                            <p className="mb-2 text-sm text-gray-600">{product.description}</p>
                            
                            {product.whereToBuy && (
                              <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{product.whereToBuy}</span>
                              </div>
                            )}
                            
                            {product.environmentalBenefits && (
                              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                <h4 className="mb-1 font-medium">Environmental Benefits</h4>
                                <p>{product.environmentalBenefits}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {(!searchResults?.products || searchResults.products.length === 0) && (
                          <div className="rounded-lg border p-6 text-center">
                            <Search className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                            <h3 className="mb-2 text-lg font-medium text-gray-600">No products found</h3>
                            <p className="text-sm text-gray-500">
                              Try a different search term or remove location filter
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 text-center text-sm text-gray-500">
                      <p className="flex items-center justify-center">
                        <Info className="mr-1 h-3 w-3" />
                        Can't find what you're looking for? Try uploading an image instead.
                      </p>
                    </CardFooter>
                  </>
                )}
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-gray-600">
              Need to dispose of something instead?
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/get-rid">
                <Recycle className="h-4 w-4" />
                Find Recycling Options
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

