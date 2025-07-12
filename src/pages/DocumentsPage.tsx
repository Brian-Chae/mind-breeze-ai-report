import React, { useState } from 'react'
import { cn } from '../components/ui/utils'
import { 
  FileText, 
  Search, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Clipboard,
  Check,
  ArrowRight,
  Code,
  Zap,
  BookOpen,
  Settings,
  Download
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export const DocumentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('getting-started')
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started', 'api-reference'])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const documentStructure = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      items: [
        { id: 'introduction', title: 'Introduction' },
        { id: 'installation', title: 'Installation' },
        { id: 'quick-start', title: 'Quick Start' },
        { id: 'first-connection', title: 'First Connection' }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      items: [
        { id: 'device-api', title: 'Device API' },
        { id: 'data-api', title: 'Data API' },
        { id: 'visualization-api', title: 'Visualization API' },
        { id: 'analysis-api', title: 'Analysis API' }
      ]
    },
    {
      id: 'guides',
      title: 'Guides',
      icon: BookOpen,
      items: [
        { id: 'eeg-analysis', title: 'EEG Data Analysis' },
        { id: 'ppg-processing', title: 'PPG Signal Processing' },
        { id: 'real-time-viz', title: 'Real-time Visualization' },
        { id: 'custom-algorithms', title: 'Custom Algorithms' }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: Settings,
      items: [
        { id: 'configuration', title: 'Configuration' },
        { id: 'troubleshooting', title: 'Troubleshooting' },
        { id: 'performance', title: 'Performance Optimization' },
        { id: 'deployment', title: 'Deployment' }
      ]
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'introduction':
        return <IntroductionContent copyCode={copyCode} copiedCode={copiedCode} />
      case 'installation':
        return <InstallationContent copyCode={copyCode} copiedCode={copiedCode} />
      case 'quick-start':
        return <QuickStartContent copyCode={copyCode} copiedCode={copiedCode} />
      case 'device-api':
        return <DeviceAPIContent copyCode={copyCode} copiedCode={copiedCode} />
      default:
        return <IntroductionContent copyCode={copyCode} copiedCode={copiedCode} />
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border bg-black border-gray-500">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 h-8 px-3 py-2 text-sm bg-transparent border-none text-white placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto p-2">
          <nav className="space-y-1">
            {documentStructure.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <section.icon className="w-4 h-4" />
                  <span>{section.title}</span>
                </button>
                {expandedSections.includes(section.id) && (
                  <div className="ml-6 space-y-1 mt-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full text-left px-2 py-1 text-sm rounded-md transition-colors",
                          activeSection === item.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-start px-3 py-2 text-sm bg-transparent border-0 rounded-md hover:bg-accent transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button className="w-full flex items-center justify-start px-3 py-2 text-sm bg-transparent border-0 rounded-md hover:bg-accent transition-colors">
              <ExternalLink className="w-4 h-4 mr-2" />
              GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-black">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-black border border-gray-500 rounded-3xl shadow-2xl p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Components
function IntroductionContent({ copyCode, copiedCode }: { copyCode: (code: string, id: string) => void, copiedCode: string | null }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="not-prose mb-8">
        <h1 className="text-4xl font-medium mb-4">LINK BAND SDK</h1>
        <p className="text-xl text-muted-foreground">
          뇌파, 맥파, 가속도 데이터를 실시간으로 수집하고 분석하는 강력한 SDK
        </p>
      </div>

      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <h3>Real-time Data</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            실시간 뇌파, 맥파, 가속도 데이터 스트리밍
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-green-500" />
            </div>
            <h3>Easy Integration</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            간단한 API로 빠른 개발 및 통합
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-500" />
            </div>
            <h3>Rich Analytics</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            고급 신호 분석 및 지표 추출 기능
          </p>
        </div>
      </div>

      <h2>What is LINK BAND?</h2>
      <p>
        LINK BAND는 뇌파(EEG), 맥파(PPG), 가속도(Accelerometer) 센서를 통합한 웨어러블 디바이스입니다. 
        본 SDK는 LINK BAND 디바이스와의 연결, 데이터 수집, 실시간 분석 및 시각화를 위한 
        종합적인 개발 도구를 제공합니다.
      </p>

      <h3>주요 기능</h3>
      <ul>
        <li><strong>디바이스 관리</strong>: 블루투스를 통한 LINK BAND 연결 및 관리</li>
        <li><strong>실시간 데이터</strong>: 250Hz 샘플링으로 고품질 생체신호 수집</li>
        <li><strong>신호 분석</strong>: FFT, 필터링, 파워 스펙트럼 분석</li>
        <li><strong>지표 추출</strong>: 집중도, 이완도, 스트레스 레벨 등 다양한 지표</li>
        <li><strong>데이터 시각화</strong>: 실시간 차트 및 그래프</li>
      </ul>

      <h3>지원 플랫폼</h3>
      <div className="not-prose">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">Web (JavaScript/TypeScript)</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">React</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">Node.js</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">Python</span>
        </div>
      </div>

      <h2>Quick Example</h2>
      <CodeBlock
        code={`import { LinkBandSDK } from 'linkband-sdk';

// SDK 초기화
const sdk = new LinkBandSDK({
  apiKey: 'your-api-key',
  environment: 'development'
});

// 디바이스 연결
const device = await sdk.connectDevice('AA:BB:CC:DD:EE:FF');

// 실시간 EEG 데이터 스트리밍
device.onEEGData((data) => {
  // { alpha: 12.5, beta: 8.3, gamma: 5.1, theta: 15.2 }
});

// 데이터 수집 시작
await device.startDataCollection();`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="quick-example"
      />

      <div className="not-prose mt-8">
        <div className="flex gap-4">
          <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            시작하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-md hover:bg-secondary/80 transition-colors">
            <ExternalLink className="w-4 h-4 mr-2" />
            GitHub에서 보기
          </button>
        </div>
      </div>
    </div>
  )
}

function InstallationContent({ copyCode, copiedCode }: { copyCode: (code: string, id: string) => void, copiedCode: string | null }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Installation</h1>
      <p>LINK BAND SDK를 프로젝트에 설치하는 방법을 안내합니다.</p>

      <h2>NPM으로 설치</h2>
      <CodeBlock
        code="npm install linkband-sdk"
        language="bash"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="npm-install"
      />

      <h2>Yarn으로 설치</h2>
      <CodeBlock
        code="yarn add linkband-sdk"
        language="bash"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="yarn-install"
      />

      <h2>CDN으로 사용</h2>
      <p>CDN을 통해 직접 브라우저에서 사용할 수 있습니다:</p>
      <CodeBlock
        code={`<script src="https://cdn.jsdelivr.net/npm/linkband-sdk@latest/dist/index.js"></script>
<script>
  const sdk = new LinkBandSDK.default({
    apiKey: 'your-api-key'
  });
</script>`}
        language="html"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="cdn-install"
      />

      <h2>시스템 요구사항</h2>
      <ul>
        <li>Node.js 16.0.0 이상</li>
        <li>현대적인 웹 브라우저 (Chrome 80+, Firefox 78+, Safari 14+)</li>
        <li>블루투스 LE 지원</li>
        <li>HTTPS 환경 (웹 블루투스 API 요구사항)</li>
      </ul>

      <h2>TypeScript 지원</h2>
      <p>LINK BAND SDK는 TypeScript로 작성되었으며 타입 정의가 포함되어 있습니다.</p>
      <CodeBlock
        code={`import { LinkBandSDK, EEGData, PPGData } from 'linkband-sdk';

const sdk: LinkBandSDK = new LinkBandSDK({
  apiKey: 'your-api-key'
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="typescript-example"
      />
    </div>
  )
}

function QuickStartContent({ copyCode, copiedCode }: { copyCode: (code: string, id: string) => void, copiedCode: string | null }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Quick Start</h1>
      <p>5분 안에 LINK BAND SDK를 사용하여 첫 번째 애플리케이션을 만들어보세요.</p>

      <h2>1. SDK 초기화</h2>
      <p>먼저 API 키를 사용하여 SDK를 초기화합니다:</p>
      <CodeBlock
        code={`import { LinkBandSDK } from 'linkband-sdk';

const sdk = new LinkBandSDK({
  apiKey: 'YOUR_API_KEY_HERE',
  environment: 'development', // 'development' | 'production'
  logging: true // 개발 중 디버그 로그 활성화
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="sdk-init"
      />

      <h2>2. 디바이스 검색 및 연결</h2>
      <CodeBlock
        code={`// 사용 가능한 디바이스 검색
const devices = await sdk.scanDevices();

// 첫 번째 디바이스에 연결
const device = await sdk.connectDevice(devices[0].id);

// 또는 MAC 주소로 직접 연결
const device = await sdk.connectDevice('AA:BB:CC:DD:EE:FF');`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="device-connect"
      />

      <h2>3. 데이터 수집 시작</h2>
      <CodeBlock
        code={`// EEG 데이터 리스너 등록
device.onEEGData((data) => {
  // { alpha: 12.5, beta: 8.3, gamma: 5.1, theta: 15.2, timestamp: 1640995200000 }
});

// PPG 데이터 리스너 등록
device.onPPGData((data) => {
  // { heartRate: 72, hrv: 45, spo2: 98, timestamp: 1640995200000 }
});

// 가속도 데이터 리스너 등록
device.onAccelerometerData((data) => {
  // { x: 0.1, y: -0.2, z: 9.8, timestamp: 1640995200000 }
});

// 데이터 수집 시작
await device.startDataCollection();`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="data-collection"
      />

      <h2>4. 실시간 분석</h2>
      <CodeBlock
        code={`// 실시간 지표 계산
device.onAnalysis((analysis) => {
  /*
  {
    attention: 75,      // 집중도 (0-100)
    relaxation: 60,     // 이완도 (0-100)
    stress: 25,         // 스트레스 (0-100)
    mentalWorkload: 40, // 정신적 부하 (0-100)
    timestamp: 1640995200000
  }
  */
});

// 분석 시작 (1초마다 지표 계산)
await device.startAnalysis({
  interval: 1000, // 1초
  windowSize: 5000 // 5초 윈도우
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="analysis"
      />

      <h2>5. 데이터 저장</h2>
      <CodeBlock
        code={`// 세션 시작
const session = await device.startSession({
  name: 'Morning Meditation',
  duration: 600000, // 10분 (밀리초)
  tags: ['meditation', 'morning']
});

// 세션 종료 및 저장
const savedSession = await session.save();

// 저장된 데이터 내보내기
const csvData = await sdk.exportData(savedSession.id, 'csv');
const jsonData = await sdk.exportData(savedSession.id, 'json');`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="data-save"
      />

      <h2>완전한 예제</h2>
      <CodeBlock
        code={`import { LinkBandSDK } from 'linkband-sdk';

async function main() {
  // SDK 초기화
  const sdk = new LinkBandSDK({
    apiKey: 'YOUR_API_KEY_HERE'
  });

  try {
    // 디바이스 연결
    const devices = await sdk.scanDevices();
    const device = await sdk.connectDevice(devices[0].id);

    // 세션 시작
    const session = await device.startSession({
      name: 'Quick Start Demo'
    });

    // 데이터 리스너 등록
    device.onEEGData((data) => {
      // EEG 데이터 처리
    });

    device.onAnalysis((analysis) => {
      // 분석 결과 처리
    });

    // 데이터 수집 및 분석 시작
    await device.startDataCollection();
    await device.startAnalysis();

    // 30초 후 중지
    setTimeout(async () => {
      await device.stopDataCollection();
      await device.stopAnalysis();
      const savedSession = await session.save();
    }, 30000);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="complete-example"
      />
    </div>
  )
}

function DeviceAPIContent({ copyCode, copiedCode }: { copyCode: (code: string, id: string) => void, copiedCode: string | null }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Device API</h1>
      <p>LINK BAND 디바이스 연결 및 관리를 위한 API 레퍼런스입니다.</p>

      <h2>Class: LinkBandSDK</h2>
      <p>메인 SDK 클래스입니다.</p>

      <h3>Constructor</h3>
      <CodeBlock
        code={`new LinkBandSDK(options: SDKOptions)`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="constructor"
      />

      <h4>SDKOptions</h4>
      <div className="not-prose">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Property</th>
                <th className="border border-border p-2 text-left">Type</th>
                <th className="border border-border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2"><code>apiKey</code></td>
                <td className="border border-border p-2">string</td>
                <td className="border border-border p-2">API 키 (필수)</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>environment</code></td>
                <td className="border border-border p-2">'development' | 'production'</td>
                <td className="border border-border p-2">환경 설정 (기본값: 'production')</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>logging</code></td>
                <td className="border border-border p-2">boolean</td>
                <td className="border border-border p-2">로깅 활성화 (기본값: false)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h3>Methods</h3>

      <h4>scanDevices()</h4>
      <p>주변의 LINK BAND 디바이스를 검색합니다.</p>
      <CodeBlock
        code={`async scanDevices(options?: ScanOptions): Promise<DeviceInfo[]>

// 사용 예시
const devices = await sdk.scanDevices({
  timeout: 10000, // 10초 스캔
  filter: {
    name: 'LINK BAND', // 디바이스 이름 필터
    rssi: -80 // 최소 신호 강도
  }
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="scan-devices"
      />

      <h4>connectDevice()</h4>
      <p>디바이스에 연결합니다.</p>
      <CodeBlock
        code={`async connectDevice(deviceId: string): Promise<LinkBandDevice>

// 사용 예시
const device = await sdk.connectDevice('AA:BB:CC:DD:EE:FF');

// 연결 상태 확인
// device.isConnected, device.batteryLevel, device.firmwareVersion 사용`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="connect-device"
      />

      <h2>Class: LinkBandDevice</h2>
      <p>연결된 LINK BAND 디바이스를 제어하는 클래스입니다.</p>

      <h3>Properties</h3>
      <div className="not-prose">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Property</th>
                <th className="border border-border p-2 text-left">Type</th>
                <th className="border border-border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2"><code>id</code></td>
                <td className="border border-border p-2">string</td>
                <td className="border border-border p-2">디바이스 ID (MAC 주소)</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>name</code></td>
                <td className="border border-border p-2">string</td>
                <td className="border border-border p-2">디바이스 이름</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>isConnected</code></td>
                <td className="border border-border p-2">boolean</td>
                <td className="border border-border p-2">연결 상태</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>batteryLevel</code></td>
                <td className="border border-border p-2">number</td>
                <td className="border border-border p-2">배터리 레벨 (0-100)</td>
              </tr>
              <tr>
                <td className="border border-border p-2"><code>firmwareVersion</code></td>
                <td className="border border-border p-2">string</td>
                <td className="border border-border p-2">펌웨어 버전</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h3>Data Collection Methods</h3>

      <h4>startDataCollection()</h4>
      <CodeBlock
        code={`async startDataCollection(options?: CollectionOptions): Promise<void>

// 사용 예시
await device.startDataCollection({
  eeg: true,
  ppg: true,
  accelerometer: true,
  sampleRate: 250 // Hz
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="start-collection"
      />

      <h4>stopDataCollection()</h4>
      <CodeBlock
        code={`async stopDataCollection(): Promise<void>`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="stop-collection"
      />

      <h3>Event Listeners</h3>

      <h4>onEEGData()</h4>
      <CodeBlock
        code={`device.onEEGData((data: EEGData) => {
  console.log(data);
  /*
  {
    alpha: 12.5,     // Alpha 파워 (8-13 Hz)
    beta: 8.3,       // Beta 파워 (13-30 Hz)
    gamma: 5.1,      // Gamma 파워 (30-100 Hz)
    theta: 15.2,     // Theta 파워 (4-8 Hz)
    delta: 20.1,     // Delta 파워 (1-4 Hz)
    timestamp: 1640995200000
  }
  */
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="eeg-listener"
      />

      <h4>onPPGData()</h4>
      <CodeBlock
        code={`device.onPPGData((data: PPGData) => {
  console.log(data);
  /*
  {
    heartRate: 72,   // 심박수 (BPM)
    hrv: 45,         // 심박변이도 (ms)
    spo2: 98,        // 산소포화도 (%)
    timestamp: 1640995200000
  }
  */
});`}
        language="typescript"
        copyCode={copyCode}
        copiedCode={copiedCode}
        id="ppg-listener"
      />
    </div>
  )
}

function CodeBlock({ code, language, copyCode, copiedCode, id }: {
  code: string
  language: string
  copyCode: (code: string, id: string) => void
  copiedCode: string | null
  id: string
}) {
  // VS Code Dark+ 테마의 색상을 커스터마이징
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: '#1e1e1e',
      margin: 0,
      padding: '1rem',
      fontSize: '0.875rem',
      lineHeight: '1.5'
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: '#1e1e1e',
      fontSize: '0.875rem'
    }
  }

  return (
    <div className="not-prose relative group">
      <div className="bg-[#1e1e1e] border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#2d2d30]">
          <span className="text-xs text-[#cccccc] font-medium">{language}</span>
          <button
            onClick={() => copyCode(code, id)}
            className="h-6 px-2 text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          >
            {copiedCode === id ? (
              <Check className="w-3 h-3" />
            ) : (
              <Clipboard className="w-3 h-3" />
            )}
          </button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          customStyle={{
            margin: 0,
            background: '#1e1e1e'
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
} 