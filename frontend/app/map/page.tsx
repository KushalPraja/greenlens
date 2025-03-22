"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Search, Filter, Phone, Globe, Clock, Star, Info, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample locations data - this would typically come from an API based on user location
const locations = [
  {
    id: 1,
    name: "City Recycling Center",
    address: "123 Green St, Cityville, CA 90210",
    phone: "(555) 123-4567",
    website: "https://recyclingcenter.org",
    hours: "Mon-Sat: 8am-6pm, Sun: 9am-4pm",
    distance: "0.8 miles",
    rating: 4.5,
    materials: ["Glass", "Paper", "Plastic", "Metal", "Electronics"],
    description: "Official city recycling center accepting a wide range of materials. Free drop-off for residents.",
    coordinates: { lat: 34.052235, lng: -118.243683 }
  },
  {
    id: 2,
    name: "EcoDrops Collection Point",
    address: "456 Sustainable Ave, Cityville, CA 90211",
    phone: "(555) 987-6543",
    website: "https://ecodrops.com",
    hours: "Mon-Fri: 9am-7pm, Sat-Sun: 10am-5pm",
    distance: "1.2 miles",
    rating: 4.2,
    materials: ["Batteries", "Light Bulbs", "Paint", "Chemicals"],
    description: "Specialized in hazardous waste collection. Appointment recommended for large quantities.",
    coordinates: { lat: 34.053235, lng: -118.253683 }
  },
  {
    id: 3,
    name: "GreenTech Electronics Recycling",
    address: "789 Recycle Blvd, Cityville, CA 90212",
    phone: "(555) 456-7890",
    website: "https://greentechrecycling.com",
    hours: "Tue-Sat: 10am-6pm",
    distance: "2.4 miles",
    rating: 4.7,
    materials: ["Computers", "Phones", "TVs", "Appliances", "Batteries"],
    description: "Specializing in electronics recycling with secure data destruction. Some items may have a fee.",
    coordinates: { lat: 34.062235, lng: -118.263683 }
  },
  {
    id: 4,
    name: "Community Donation Center",
    address: "321 Giving Lane, Cityville, CA 90213",
    phone: "(555) 789-0123",
    website: "https://communitydonations.org",
    hours: "Mon-Sun: 9am-8pm",
    distance: "1.5 miles",
    rating: 4.8,
    materials: ["Clothing", "Furniture", "Books", "Household Items"],
    description: "Nonprofit organization accepting gently used items for reuse. Tax receipts available.",
    coordinates: { lat: 34.042235, lng: -118.233683 }
  },
  {
    id: 5,
    name: "SuperMart Recycling Station",
    address: "555 Market St, Cityville, CA 90214",
    phone: "(555) 234-5678",
    website: "https://supermart.com/recycling",
    hours: "Daily: 7am-10pm",
    distance: "0.6 miles",
    rating: 3.9,
    materials: ["Plastic Bags", "Glass", "Aluminum", "Paper"],
    description: "Convenient recycling drop-off located at the entrance of SuperMart grocery store.",
    coordinates: { lat: 34.057235, lng: -118.248683 }
  }
];

const materialCategories = [
  "All Materials",
  "Glass",
  "Paper",
  "Plastic",
  "Metal",
  "Electronics",
  "Batteries",
  "Hazardous Waste",
  "Clothing",
  "Furniture"
];

export default function MapPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("All Materials");
  const [radius, setRadius] = useState("10");
  
  // Filter locations based on search term and selected material
  const filteredLocations = locations.filter(location => {
    // Filter by search term (name or address)
    const matchesSearch = searchTerm === "" || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by material category
    const matchesMaterial = selectedMaterial === "All Materials" || 
      location.materials.some(m => m.toLowerCase() === selectedMaterial.toLowerCase());
    
    return matchesSearch && matchesMaterial;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-full bg-green-100 p-3">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-800">Recycling Map</h1>
            <p className="text-gray-600">
              Find recycling centers, donation drop-offs, and specialized waste disposal locations near you
            </p>
          </div>
          
          <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="Enter address or zip code"
                    className="pl-9"
                    defaultValue="Current Location"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="material" className="text-sm font-medium">
                  Material
                </label>
                <Select 
                  value={selectedMaterial} 
                  onValueChange={setSelectedMaterial}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map(material => (
                      <SelectItem key={material} value={material}>
                        {material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="radius" className="text-sm font-medium">
                  Distance (miles)
                </label>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Within 5 miles</SelectItem>
                    <SelectItem value="10">Within 10 miles</SelectItem>
                    <SelectItem value="25">Within 25 miles</SelectItem>
                    <SelectItem value="50">Within 50 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-green-800">Search Results</h2>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="w-[180px] pl-8 text-sm"
                      placeholder="Filter results..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""} found
                  </span>
                  <span>Within {radius} miles</span>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-2">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <Card 
                        key={location.id} 
                        className="cursor-pointer transition-all hover:border-green-300 hover:shadow-md"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">{location.name}</CardTitle>
                            <Badge variant="outline">{location.distance}</Badge>
                          </div>
                          <CardDescription className="flex items-center text-xs">
                            <MapPin className="mr-1 h-3 w-3" />
                            {location.address}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 pt-0">
                          <div className="flex flex-wrap gap-1">
                            {location.materials.slice(0, 3).map((material, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                            {location.materials.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{location.materials.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pb-2 pt-0 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                            {location.rating}/5
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 p-0 text-xs text-green-600 hover:text-green-800">
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <h3 className="mb-2 text-lg font-medium text-gray-600">No locations found</h3>
                      <p className="text-sm text-gray-500">
                        Try a different material type or expanding your search radius
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-gray-100">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg bg-gray-200">
                  {/* Placeholder for the map component */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <MapPin className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        Interactive map will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Location details panel - would typically show when clicking a location on the map */}
                {filteredLocations.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{filteredLocations[0].name}</h2>
                        <p className="text-sm text-gray-500">{filteredLocations[0].address}</p>
                      </div>
                      <Badge variant="outline">{filteredLocations[0].distance}</Badge>
                    </div>
                    
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-sm font-medium">Materials Accepted</h3>
                        <div className="flex flex-wrap gap-1">
                          {filteredLocations[0].materials.map((material, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="mb-2 text-sm font-medium">Hours</h3>
                        <p className="text-sm text-gray-600">{filteredLocations[0].hours}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Phone className="h-3 w-3" />
                        {filteredLocations[0].phone}
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Directions
                      </Button>
                    </div>
                    
                    <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">About this location</p>
                          <p className="mt-1 text-green-700">{filteredLocations[0].description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium text-green-800">
                  Don't see what you're looking for?
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Try our AI-powered assistant to find specialized disposal options for unusual items
                </p>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 sm:w-auto">
                  <Link href="/get-rid">Analyze Item for Disposal Options</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

