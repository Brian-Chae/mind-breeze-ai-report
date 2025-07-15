import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FolderOpen, Download, Upload, Trash2, Search, Filter, Calendar, BarChart3, FileText, Settings } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Layout } from '../components/Layout';
import { DataCenter } from '../components/DataCenter/DataCenter';

export const DataCenterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const mockSessions = [
    {
      id: 'session_001',
      name: 'Morning Meditation Session',
      date: '2024-01-15',
      time: '09:30:00',
      duration: '00:15:30',
      channels: 8,
      samples: 232500,
      size: '4.2 MB',
      quality: 'Excellent',
      tags: ['meditation', 'alpha'],
      status: 'completed'
    },
    {
      id: 'session_002',
      name: 'Cognitive Task - Math',
      date: '2024-01-15',
      time: '14:20:00',
      duration: '00:08:45',
      channels: 8,
      samples: 131250,
      size: '2.8 MB',
      quality: 'Good',
      tags: ['cognitive', 'beta'],
      status: 'completed'
    },
    {
      id: 'session_003',
      name: 'Sleep Study - Night 1',
      date: '2024-01-14',
      time: '22:00:00',
      duration: '07:30:00',
      channels: 8,
      samples: 6750000,
      size: '124.5 MB',
      quality: 'Fair',
      tags: ['sleep', 'delta'],
      status: 'processing'
    },
    {
      id: 'session_004',
      name: 'Stress Response Test',
      date: '2024-01-14',
      time: '16:45:00',
      duration: '00:12:20',
      channels: 8,
      samples: 185000,
      size: '3.5 MB',
      quality: 'Excellent',
      tags: ['stress', 'gamma'],
      status: 'completed'
    },
    {
      id: 'session_005',
      name: 'Focus Training Session',
      date: '2024-01-13',
      time: '11:15:00',
      duration: '00:20:15',
      channels: 8,
      samples: 303750,
      size: '5.8 MB',
      quality: 'Good',
      tags: ['focus', 'beta'],
      status: 'completed'
    }
  ];

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-500';
      case 'Good': return 'bg-blue-500';
      case 'Fair': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || session.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const totalSize = mockSessions.reduce((acc, session) => {
    const size = parseFloat(session.size.replace(' MB', ''));
    return acc + size;
  }, 0);

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  return (
    <Layout currentSection="data-center" onSectionChange={handleSectionChange}>
      <div className="h-full p-6 w-full">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Data Center
          </h1>
          <p className="text-muted-foreground text-lg">
            EEG 데이터 저장소 및 세션 관리
          </p>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground">{mockSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Data</p>
                <p className="text-2xl font-bold text-foreground">{totalSize.toFixed(1)} MB</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Session Management</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Selected</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-muted border border-border rounded-md px-3 py-2 text-foreground"
              >
                <option value="all">All Sessions</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          {/* Session List */}
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div 
                key={session.id}
                className={`border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  selectedSessions.includes(session.id) ? 'bg-muted border-blue-500' : 'bg-card'
                }`}
                onClick={() => toggleSessionSelection(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{session.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span>{session.date} {session.time}</span>
                        <span>Duration: {session.duration}</span>
                        <span>{session.channels} channels</span>
                        <span>{session.samples.toLocaleString()} samples</span>
                        <span>{session.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {session.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getQualityColor(session.quality)}`}></div>
                      <span className="text-xs text-muted-foreground">{session.quality}</span>
                    </div>

                    <Badge variant={getStatusColor(session.status)} className="text-xs">
                      {session.status}
                    </Badge>

                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No sessions found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Data Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Usage */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Storage Usage</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used Space</span>
                <span className="text-sm font-medium text-foreground">{totalSize.toFixed(1)} MB / 1.0 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${(totalSize / 1000) * 100}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold text-foreground">{(1000 - totalSize).toFixed(1)} MB</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Usage %</p>
                  <p className="text-lg font-semibold text-foreground">{((totalSize / 1000) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Session Statistics</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-lg font-semibold text-foreground">18m 30s</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Size</p>
                  <p className="text-lg font-semibold text-foreground">{(totalSize / mockSessions.length).toFixed(1)} MB</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <p className="text-lg font-semibold text-foreground">8.4/10</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-semibold text-foreground">96%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Export & Backup</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
              <Download className="w-4 h-4" />
              <span>Export as CSV</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
              <Download className="w-4 h-4" />
              <span>Export as EDF</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
              <Database className="w-4 h-4" />
              <span>Backup All Data</span>
            </Button>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}; 