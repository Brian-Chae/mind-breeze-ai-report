import React, { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  BarChart3, 
  Activity, 
  Brain, 
  Heart, 
  Play, 
  Pause, 
  Square,
  Settings,
  Download,
  Maximize2
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function Visualizer() {
  const [isRecording, setIsRecording] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState('LB001')
  const [selectedDataType, setSelectedDataType] = useState('eeg')

  // Mock EEG data
  const eegData = Array.from({ length: 100 }, (_, i) => ({
    time: i,
    alpha: Math.sin(i * 0.1) * 10 + Math.random() * 5,
    beta: Math.cos(i * 0.15) * 8 + Math.random() * 4,
    gamma: Math.sin(i * 0.2) * 6 + Math.random() * 3,
    theta: Math.cos(i * 0.08) * 12 + Math.random() * 6
  }))

  // Mock PPG data
  const ppgData = Array.from({ length: 50 }, (_, i) => ({
    time: i,
    heartRate: 70 + Math.sin(i * 0.3) * 10 + Math.random() * 5,
    hrv: 50 + Math.cos(i * 0.2) * 15 + Math.random() * 8,
    spo2: 95 + Math.random() * 4
  }))

  // Mock Accelerometer data
  const accelData = Array.from({ length: 100 }, (_, i) => ({
    time: i,
    x: Math.sin(i * 0.1) * 2 + Math.random() * 0.5,
    y: Math.cos(i * 0.15) * 1.5 + Math.random() * 0.3,
    z: Math.sin(i * 0.2) * 1.8 + Math.random() * 0.4
  }))

  // Power spectrum data
  const powerSpectrumData = [
    { frequency: '1-4 Hz', value: 15, band: 'Delta' },
    { frequency: '4-8 Hz', value: 25, band: 'Theta' },
    { frequency: '8-13 Hz', value: 45, band: 'Alpha' },
    { frequency: '13-30 Hz', value: 35, band: 'Beta' },
    { frequency: '30-100 Hz', value: 20, band: 'Gamma' }
  ]

  const indices = [
    { name: 'Attention Index', value: 78, unit: '%', color: 'text-blue-500' },
    { name: 'Relaxation Index', value: 65, unit: '%', color: 'text-green-500' },
    { name: 'Stress Level', value: 32, unit: '%', color: 'text-orange-500' },
    { name: 'Mental Workload', value: 54, unit: '%', color: 'text-purple-500' }
  ]

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Visualizer</h1>
            <p className="text-muted-foreground">실시간 데이터 시각화 및 분석</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isRecording ? "destructive" : "default"}
              onClick={toggleRecording}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium mb-2 block">Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LB001">LINK BAND #001</SelectItem>
                  <SelectItem value="LB002">LINK BAND #002</SelectItem>
                  <SelectItem value="LB003">LINK BAND #003</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Type</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eeg">EEG (뇌파)</SelectItem>
                  <SelectItem value="ppg">PPG (맥파)</SelectItem>
                  <SelectItem value="accelerometer">Accelerometer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isRecording && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Recording
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="realtime" className="space-y-6">
          <TabsList>
            <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
            <TabsTrigger value="spectrum">Power Spectrum</TabsTrigger>
            <TabsTrigger value="indices">Extracted Indices</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-6">
            {selectedDataType === 'eeg' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium">EEG Brainwave Activity</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eegData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="alpha" stroke="#3B82F6" strokeWidth={2} dot={false} name="Alpha (8-13 Hz)" />
                      <Line type="monotone" dataKey="beta" stroke="#EF4444" strokeWidth={2} dot={false} name="Beta (13-30 Hz)" />
                      <Line type="monotone" dataKey="gamma" stroke="#10B981" strokeWidth={2} dot={false} name="Gamma (30-100 Hz)" />
                      <Line type="monotone" dataKey="theta" stroke="#F59E0B" strokeWidth={2} dot={false} name="Theta (4-8 Hz)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {selectedDataType === 'ppg' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-red-500" />
                    <h3 className="font-medium">Heart Rate</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ppgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Area type="monotone" dataKey="heartRate" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium">Heart Rate Variability</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ppgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="hrv" stroke="#3B82F6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {selectedDataType === 'accelerometer' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium">3-Axis Accelerometer Data</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="x" stroke="#EF4444" strokeWidth={2} dot={false} name="X-axis" />
                      <Line type="monotone" dataKey="y" stroke="#10B981" strokeWidth={2} dot={false} name="Y-axis" />
                      <Line type="monotone" dataKey="z" stroke="#3B82F6" strokeWidth={2} dot={false} name="Z-axis" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="spectrum" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium">Power Spectrum Analysis</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={powerSpectrumData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="frequency" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="indices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {indices.map((index, i) => (
                <Card key={i} className="p-4">
                  <div className="text-center">
                    <h4 className="font-medium text-sm mb-2">{index.name}</h4>
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${index.value}, 100`}
                          className={index.color}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-medium ${index.color}`}>
                          {index.value}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{index.unit}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}