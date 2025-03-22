"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen, Search, Filter, ChevronDown, ExternalLink, ThumbsUp, Bookmark, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Sample content data - this would typically come from an API
const articles = [
  {
    id: 1,
    title: "10 Easy Ways to Reduce Plastic Waste",
    excerpt: "Simple steps to cut down on plastic in your daily life and make a positive impact on the environment.",
    image: "/images/reduce-plastic.jpg",
    category: "Tips",
    readTime: "5 min read",
    date: "Mar 15, 2025",
    likes: 124,
    bookmarked: false,
  },
  {
    id: 2,
    title: "Understanding Carbon Footprint Basics",
    excerpt: "Learn what a carbon footprint is, how to calculate yours, and practical ways to reduce your environmental impact.",
    image: "/images/carbon-footprint.jpg",
    category: "Education",
    readTime: "8 min read",
    date: "Mar 10, 2025",
    likes: 97,
    bookmarked: false,
  },
  {
    id: 3,
    title: "Sustainable Fashion: Beyond the Buzzword",
    excerpt: "What makes clothing truly sustainable and how to build an eco-friendly wardrobe without breaking the bank.",
    image: "/images/sustainable-fashion.jpg",
    category: "Fashion",
    readTime: "7 min read",
    date: "Mar 5, 2025",
    likes: 156,
    bookmarked: false,
  },
  {
    id: 4,
    title: "Home Composting for Beginners",
    excerpt: "A step-by-step guide to starting your own compost system, even in small spaces.",
    image: "/images/composting.jpg",
    category: "DIY",
    readTime: "6 min read",
    date: "Feb 28, 2025",
    likes: 88,
    bookmarked: false,
  },
  {
    id: 5,
    title: "The Environmental Impact of Your Diet",
    excerpt: "How food choices affect the planet and simple dietary shifts that can make a difference.",
    image: "/images/eco-diet.jpg",
    category: "Food",
    readTime: "9 min read",
    date: "Feb 20, 2025",
    likes: 132,
    bookmarked: false,
  },
];

const faqs = [
  {
    question: "What is the difference between recyclable and compostable?",
    answer: "Recyclable materials can be processed and turned into new products, while compostable materials break down naturally into nutrient-rich soil. Recyclable items include glass, certain plastics, paper, and metals. Compostable items include food scraps, yard waste, and specially marked compostable packaging that's designed to break down completely."
  },
  {
    question: "How do I know if a product is truly sustainable?",
    answer: "Look for credible third-party certifications like Energy Star, USDA Organic, Fair Trade, or FSC (Forest Stewardship Council). Research the company's environmental commitments and transparency. Consider the entire lifecycle of the product including materials, manufacturing process, packaging, usage, and end-of-life disposal options."
  },
  {
    question: "What's the single most effective thing I can do to reduce my environmental impact?",
    answer: "While there's no single solution that works for everyone, reducing consumption overall often has the biggest impact. This means buying less, choosing durable items, repairing instead of replacing, and considering whether you truly need new purchases. Beyond this, the most effective actions depend on your lifestyle but often include reducing meat consumption, minimizing car and air travel, and improving home energy efficiency."
  },
  {
    question: "Why should I care about sustainability?",
    answer: "Sustainability is about ensuring that our actions today don't compromise the ability of future generations to meet their needs. Environmental sustainability directly affects human well-being through clean air, safe water, food security, and climate stability. It also impacts economic sustainability as many industries depend on natural resources. Additionally, sustainable practices often lead to cost savings, improved health, and stronger communities."
  },
  {
    question: "How can I recycle electronics responsibly?",
    answer: "Don't throw electronics in regular trash as they contain hazardous materials. Many retailers like Best Buy offer electronics recycling programs. Check with your local municipality for e-waste collection events or facilities. Before recycling, try to wipe personal data, and consider donating working electronics to extend their useful life."
  },
];

const categories = [
  "All Topics",
  "Tips",
  "Education",
  "Fashion",
  "DIY",
  "Food",
  "Energy",
  "Travel",
  "Technology"
];

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Learn Sustainable Practices</h1>
      <p className="mt-4">Content coming soon...</p>
    </div>
  )
}

