import React, { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { 
  Database, 
  Search, 
  Download, 
  Upload,
  FileText,
  Calendar,
  Filter,
  MoreHorizontal,
  Trash2,
  Eye,
  Share2,
  HardDrive
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function DataCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const dataSessions = [
    {
      id: "DS001",
      name: "Morning EEG Session",
      device: "LINK BAND #001", 
      type: "EEG",
      date: "2025-01-01 09:15",
      duration: "15m 23s",
      samples: "230,400",
      size: "4.2 MB",
      status: "Completed",
      quality: "Excellent"
    },
    {
      id: "DS002", 
      name: "PPG Monitoring",
      device: "LINK BAND #002",
      type: "PPG", 
      date: "2025-01-01 10:30",
      duration: "22m 17s",
      samples: "334,200",
      size: "6.1 MB", 
      status: "Completed",
      quality: "Good"
    },
    {
      id: "DS003",
      name: "Movement Analysis", 
      device: "LINK BAND #001",
      type: "Accelerometer",
      date: "2025-01-01 14:45",
      duration: "8m 42s", 
      samples: "104,400",
      size: "1.8 MB",
      status: "Processing",
      quality: "Good"
    },
    {
      id: "DS004",
      name: "Sleep Study Data",
      device: "LINK BAND #003", 
      type: "Multi-modal",
      date: "2024-12-31 23:00",
      duration: "7h 32m",
      samples: "2,710,800", 
      size: "48.2 MB",
      status: "Completed", 
      quality: "Excellent"
    }
  ]

  const storageStats = {
    total: "1 TB",
    used: "342 GB", 
    available: "682 GB",
    utilization: 34
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'Processing': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Failed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'text-green-600'
      case 'Good': return 'text-blue-600'
      case 'Fair': return 'text-yellow-600'
      case 'Poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Data Center</h1>
            <p className="text-muted-foreground">데이터 저장소 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Storage</p>
                <p className="text-xl font-medium">{storageStats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-xl font-medium">{storageStats.used}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-medium">{storageStats.available}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Utilization</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${storageStats.utilization}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{storageStats.utilization}%</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search data sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="eeg">EEG Only</SelectItem>
                <SelectItem value="ppg">PPG Only</SelectItem>
                <SelectItem value="accelerometer">Accelerometer Only</SelectItem>
                <SelectItem value="multi-modal">Multi-modal</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Data Sessions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Data Sessions ({dataSessions.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Session</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Device</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Duration</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Samples</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Quality</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {dataSessions.map((session) => (
                  <tr key={session.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-sm">{session.name}</p>
                        <p className="text-xs text-muted-foreground">{session.id}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{session.device}</p>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline">{session.type}</Badge>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{session.date}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{session.duration}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{session.samples}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{session.size}</p>
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusColor(session.status)} variant="outline">
                        {session.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm font-medium ${getQualityColor(session.quality)}`}>
                        {session.quality}
                      </span>
                    </td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}