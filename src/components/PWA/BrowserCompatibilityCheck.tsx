import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Smartphone, Chrome, Apple, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface BrowserInfo {
  isSupported: boolean;
  browserName: string;
  platform: string;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  hasWebBluetooth: boolean;
  isSecureContext: boolean;
}

const BrowserCompatibilityCheck: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const detectBrowser = (): BrowserInfo => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);
      const hasWebBluetooth = 'bluetooth' in navigator;
      const isSecureContext = window.isSecureContext;

      let browserName = 'Unknown';
      if (userAgent.includes('Chrome')) browserName = 'Chrome';
      else if (userAgent.includes('Safari')) browserName = 'Safari';
      else if (userAgent.includes('Firefox')) browserName = 'Firefox';
      else if (userAgent.includes('Edge')) browserName = 'Edge';

      const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop';
      const isSupported = hasWebBluetooth && isSecureContext && !isIOS;

      return {
        isSupported,
        browserName,
        platform,
        isIOS,
        isAndroid,
        isMobile,
        hasWebBluetooth,
        isSecureContext
      };
    };

    setBrowserInfo(detectBrowser());
  }, []);

  const openBluefy = () => {
    // App Store의 Bluefy 앱 링크로 이동
    window.open('https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055', '_blank');
  };

  const openWebBLE = () => {
    // WebBLE 앱 링크로 이동
    window.open('https://apps.apple.com/app/webble/id1193531073', '_blank');
  };

  if (!browserInfo) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* 지원 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {browserInfo.isSupported ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            브라우저 호환성 상태
          </CardTitle>
          <CardDescription>
            현재 브라우저: {browserInfo.browserName} on {browserInfo.platform}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={browserInfo.hasWebBluetooth ? "default" : "destructive"}>
                {browserInfo.hasWebBluetooth ? "지원" : "미지원"}
              </Badge>
              <span className="text-sm">Web Bluetooth API</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={browserInfo.isSecureContext ? "default" : "destructive"}>
                {browserInfo.isSecureContext ? "안전" : "불안전"}
              </Badge>
              <span className="text-sm">보안 컨텍스트 (HTTPS)</span>
            </div>
          </div>

          {!browserInfo.isSupported && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                현재 브라우저에서는 LINK BAND 디바이스 연결을 지원하지 않습니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* iOS 사용자 안내 */}
      {browserInfo.isIOS && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Apple className="w-5 h-5" />
              iOS 사용자 안내
            </CardTitle>
            <CardDescription className="text-blue-700">
              iOS Safari는 Web Bluetooth를 지원하지 않지만, 대안이 있습니다!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">✅ 권장 방법: Bluefy 브라우저</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Web Bluetooth를 지원하는 전용 iOS 브라우저입니다.
                </p>
                <Button 
                  onClick={openBluefy}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  App Store에서 Bluefy 다운로드
                </Button>
              </div>

              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🔧 대안: WebBLE 브라우저</h4>
                <p className="text-sm text-blue-700 mb-3">
                  또 다른 Web Bluetooth 지원 브라우저입니다.
                </p>
                <Button 
                  onClick={openWebBLE}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  WebBLE 브라우저 다운로드
                </Button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">⚡ 사용 방법</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. 위 앱 중 하나를 다운로드</li>
                <li>2. 앱에서 <code className="bg-yellow-200 px-1 rounded">sdk.linkband.store</code> 접속</li>
                <li>3. LINK BAND 디바이스 연결 및 사용</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 안드로이드 사용자 안내 */}
      {browserInfo.isAndroid && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Smartphone className="w-5 h-5" />
              Android 사용자 안내
            </CardTitle>
            <CardDescription className="text-green-700">
              {browserInfo.isSupported ? 
                "현재 브라우저에서 LINK BAND 연결이 가능합니다!" :
                "Chrome 또는 Edge 브라우저를 사용해주세요."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {browserInfo.isSupported ? (
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ 연결 준비 완료</h4>
                <p className="text-sm text-green-700">
                  LINK BAND 페이지로 이동하여 디바이스를 연결하세요.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">🔧 권장 브라우저</h4>
                <p className="text-sm text-green-700 mb-3">
                  Chrome 또는 Edge 브라우저에서 이 사이트를 열어주세요.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.android.chrome', '_blank')}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Chrome 브라우저 다운로드
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 데스크톱 사용자 안내 */}
      {!browserInfo.isMobile && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Chrome className="w-5 h-5" />
              데스크톱 사용자 안내
            </CardTitle>
            <CardDescription className="text-purple-700">
              {browserInfo.isSupported ? 
                "현재 브라우저에서 LINK BAND 연결이 가능합니다!" :
                "Chrome, Edge, 또는 Opera 브라우저를 사용해주세요."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {browserInfo.isSupported ? (
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">✅ 연결 준비 완료</h4>
                <p className="text-sm text-purple-700">
                  LINK BAND 페이지로 이동하여 디바이스를 연결하세요.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🔧 지원 브라우저</h4>
                <p className="text-sm text-purple-700 mb-3">
                  다음 브라우저에서 Web Bluetooth를 지원합니다:
                </p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Chrome 56+</li>
                  <li>• Edge 79+</li>
                  <li>• Opera 43+</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 상세 정보 토글 */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm"
        >
          {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
        </Button>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-800">기술 세부사항</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">User Agent:</span>
                <p className="text-gray-600 break-all">{navigator.userAgent}</p>
              </div>
              <div>
                <span className="font-semibold">Platform:</span>
                <p className="text-gray-600">{navigator.platform}</p>
              </div>
              <div>
                <span className="font-semibold">Language:</span>
                <p className="text-gray-600">{navigator.language}</p>
              </div>
              <div>
                <span className="font-semibold">Online:</span>
                <p className="text-gray-600">{navigator.onLine ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrowserCompatibilityCheck; 