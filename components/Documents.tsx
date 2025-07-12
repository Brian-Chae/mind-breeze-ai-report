import React, { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { 
  FileText, 
  Search, 
  Download, 
  ExternalLink,
  BookOpen,
  Code,
  Lightbulb,
  Wrench,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function Documents() {
  const [searchQuery, setSearchQuery] = useState('')

  const documentCategories = [
    {
      title: "Getting Started",
      icon: Lightbulb,
      color: "text-yellow-500",
      docs: [
        { title: "Quick Start Guide", description: "LINK BAND SDK 시작하기", type: "guide", readTime: "5 min" },
        { title: "Installation", description: "SDK 설치 및 환경 설정", type: "guide", readTime: "3 min" },
        { title: "First Connection", description: "첫 디바이스 연결하기", type: "tutorial", readTime: "10 min" }
      ]
    },
    {
      title: "API Reference", 
      icon: Code,
      color: "text-blue-500",
      docs: [
        { title: "Device API", description: "디바이스 연결 및 관리 API", type: "reference", readTime: "15 min" },
        { title: "Data API", description: "데이터 수집 및 처리 API", type: "reference", readTime: "20 min" },
        { title: "Visualization API", description: "데이터 시각화 API", type: "reference", readTime: "12 min" },
        { title: "Analysis API", description: "신호 분석 및 지표 계산 API", type: "reference", readTime: "18 min" }
      ]
    },
    {
      title: "Tutorials",
      icon: BookOpen, 
      color: "text-green-500",
      docs: [
        { title: "EEG Data Analysis", description: "뇌파 데이터 분석 튜토리얼", type: "tutorial", readTime: "25 min" },
        { title: "PPG Signal Processing", description: "맥파 신호 처리 방법", type: "tutorial", readTime: "20 min" },
        { title: "Real-time Visualization", description: "실시간 데이터 시각화", type: "tutorial", readTime: "15 min" },
        { title: "Custom Algorithms", description: "사용자 정의 알고리즘 구현", type: "tutorial", readTime: "30 min" }
      ]
    },
    {
      title: "Tools & Utilities",
      icon: Wrench,
      color: "text-purple-500", 
      docs: [
        { title: "Data Export Tools", description: "데이터 내보내기 도구 사용법", type: "tool", readTime: "8 min" },
        { title: "Calibration Guide", description: "디바이스 캘리브레이션 가이드", type: "guide", readTime: "12 min" },
        { title: "Troubleshooting", description: "문제 해결 가이드", type: "guide", readTime: "10 min" }
      ]
    }
  ]

  const popularDocs = [
    { title: "Quick Start Guide", views: 1250, category: "Getting Started" },
    { title: "Device API", views: 892, category: "API Reference" },
    { title: "EEG Data Analysis", views: 734, category: "Tutorials" },
    { title: "Troubleshooting", views: 567, category: "Tools & Utilities" }
  ]

  const recentUpdates = [
    { title: "SDK v1.2.0 Release Notes", date: "2025-01-01", type: "update" },
    { title: "New PPG Analysis Features", date: "2024-12-28", type: "feature" },
    { title: "Bluetooth Connection Guide Updated", date: "2024-12-25", type: "update" },
    { title: "Performance Optimization Tips", date: "2024-12-22", type: "guide" }
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tutorial': return 'bg-green-100 text-green-800 border-green-200'
      case 'reference': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'tool': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Documentation</h1>
            <p className="text-muted-foreground">LINK BAND SDK 문서 및 가이드</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              API Docs
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 bg-black border-gray-500">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-none text-white placeholder:text-gray-400"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Documentation */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="browse" className="space-y-6">
              <TabsList>
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="recent">Recent Updates</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-6">
                {documentCategories.map((category, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-muted ${category.color}`}>
                        <category.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-medium">{category.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {category.docs.map((doc, docIndex) => (
                        <div key={docIndex} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{doc.title}</p>
                              <Badge className={getTypeColor(doc.type)} variant="outline">
                                {doc.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{doc.readTime}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="popular" className="space-y-4">
                <Card className="p-6">
                  <h3 className="font-medium mb-4">Most Popular Documents</h3>
                  <div className="space-y-3">
                    {popularDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">{doc.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <Card className="p-6">
                  <h3 className="font-medium mb-4">Recent Updates</h3>
                  <div className="space-y-3">
                    {recentUpdates.map((update, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-muted-foreground">{update.date}</p>
                        </div>
                        <Badge className={getTypeColor(update.type)} variant="outline">
                          {update.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="font-medium mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Code className="w-4 h-4 mr-2" />
                  API Reference
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Changelog
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub Repository
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Examples
                </Button>
              </div>
            </Card>

            {/* SDK Info */}
            <Card className="p-6">
              <h3 className="font-medium mb-4">SDK Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Version</p>
                  <p className="font-medium">v1.2.0</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">January 1, 2025</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License</p>
                  <p className="font-medium">MIT License</p>
                </div>
              </div>
            </Card>

            {/* Support */}
            <Card className="p-6">
              <h3 className="font-medium mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full">
                  Community Forum
                </Button>
                <Button variant="outline" className="w-full">
                  Report Issue
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}