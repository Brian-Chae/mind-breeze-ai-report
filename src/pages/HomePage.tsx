import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { cn } from '../components/ui/utils'
import { SessionManager } from '../components/SessionManager'
import { Layout } from '../components/Layout'
import { 
  Activity, 
  Database, 
  Bluetooth, 
  TrendingUp, 
  Users, 
  Zap,
  CircuitBoard,
  Heart,
  Brain,
  FileText
} from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`)
  }
  const stats = [
    {
      title: "Connected Devices",
      value: "3",
      change: "+2",
      icon: Bluetooth,
      color: "text-blue-500"
    },
    {
      title: "Data Sessions",
      value: "127",
      change: "+15",
      icon: Database,
      color: "text-green-500"
    },
    {
      title: "Active Users",
      value: "8",
      change: "+3",
      icon: Users,
      color: "text-purple-500"
    },
    {
      title: "Processing Rate",
      value: "98.5%",
      change: "+1.2%",
      icon: TrendingUp,
      color: "text-orange-500"
    }
  ]

  const recentDevices = [
    { id: "LB001", name: "LINK BAND #001", status: "Connected", battery: 87, signal: "Strong" },
    { id: "LB002", name: "LINK BAND #002", status: "Connected", battery: 56, signal: "Medium" },
    { id: "LB003", name: "LINK BAND #003", status: "Disconnected", battery: 23, signal: "Weak" },
  ]

  const dataTypes = [
    { type: "EEG (뇌파)", samples: "2.4M", icon: Brain, color: "text-blue-500" },
    { type: "PPG (맥파)", samples: "1.8M", icon: Heart, color: "text-red-500" },
    { type: "Accelerometer", samples: "3.2M", icon: Activity, color: "text-green-500" },
  ]

  return (
    <Layout currentSection="dashboard" onSectionChange={handleSectionChange}>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">실시간 LINK BAND SDK 모니터링</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              SDK Active
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-medium mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-green-600">{stat.change}</span>
                    <span className="text-xs text-muted-foreground">vs last hour</span>
                  </div>
                </div>
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Manager */}
          <div className="lg:col-span-1">
            <SessionManager />
          </div>

          {/* Connected Devices */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Connected Devices</h3>
              <Button variant="outline" size="sm">
                <Bluetooth className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
            <div className="space-y-3">
              {recentDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CircuitBoard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={device.status === 'Connected' ? 'default' : 'secondary'}
                      className="mb-1"
                    >
                      {device.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {device.battery}% • {device.signal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Data Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Data Collection</h3>
              <Button variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {dataTypes.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-muted", data.color)}>
                      <data.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{data.type}</p>
                      <p className="text-xs text-muted-foreground">{data.samples} samples</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${60 + index * 15}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Bluetooth className="w-4 h-4 mr-2" />
              Connect New Device
            </Button>
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </Card>
        </div>
      </div>
    </Layout>
  )
}