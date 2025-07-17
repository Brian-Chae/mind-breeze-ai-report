import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { ReportViewerModal } from '@domains/ai-report/components/ReportViewerModal';
import reportSharingService, { ShareableReport, ShareLinkAuth } from '@domains/ai-report/services/ReportSharingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import { Loader2, Calendar, Shield, User, Clock, Eye } from 'lucide-react';

interface SharedReportPageProps {}

export function SharedReportPage({}: SharedReportPageProps) {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'loading' | 'auth' | 'viewing'>('loading');
  const [shareableReport, setShareableReport] = useState<ShareableReport | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [birthDate, setBirthDate] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    if (shareToken) {
      loadShareableReport();
    } else {
      navigate('/');
    }
  }, [shareToken]);

  const loadShareableReport = async () => {
    if (!shareToken) return;

    try {
      setStep('loading');
      const report = await reportSharingService.getShareableReport(shareToken);
      
      if (!report) {
        setAuthError('유효하지 않은 링크입니다.');
        return;
      }

      // 만료 확인
      if (new Date() > report.expiresAt) {
        setAuthError('링크가 만료되었습니다.');
        return;
      }

      // 활성 상태 확인
      if (!report.isActive) {
        setAuthError('비활성화된 링크입니다.');
        return;
      }

      // 접근 횟수 확인
      if (report.accessCount >= report.maxAccessCount) {
        setAuthError('최대 접근 횟수를 초과했습니다.');
        return;
      }

      setShareableReport(report);
      setStep('auth');
    } catch (error) {
      console.error('공유 리포트 로드 실패:', error);
      setAuthError('리포트를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleAuthenticate = async () => {
    if (!shareToken || !birthDate) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const auth: ShareLinkAuth = { birthDate };
      const result = await reportSharingService.authenticateAndAccess(shareToken, auth);

      if (result.success && result.reportId) {
        // 실제 리포트 데이터 로드
        await loadReportData(result.reportId);
      } else {
        setAuthError(result.errorMessage || '인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 실패:', error);
      setAuthError('인증 중 오류가 발생했습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadReportData = async (reportId: string) => {
    setIsLoadingReport(true);
    
    try {
      // Firestore에서 실제 리포트 데이터 로드
      const reportDoc = await getDoc(doc(db, 'ai_analysis_results', reportId));
      
      if (reportDoc.exists()) {
        const data = reportDoc.data();
        
        // Firestore Timestamp를 Date로 변환
        const processedData = {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        };
        
        setReportData(processedData);
        setStep('viewing');
      } else {
        setAuthError('리포트 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error);
      setAuthError('리포트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAccessInfo = (count: number, max: number) => {
    return `${count}/${max}회 열람`;
  };

  // 로딩 화면
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">리포트 정보를 확인하고 있습니다...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 인증 화면
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">AI 건강 분석 리포트</CardTitle>
            <CardDescription>
              리포트 열람을 위해 본인 확인이 필요합니다
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 리포트 정보 */}
            {shareableReport && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>분석 대상: {shareableReport.subjectName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>생성일: {formatDate(shareableReport.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>{formatAccessInfo(shareableReport.accessCount, shareableReport.maxAccessCount)}</span>
                </div>
              </div>
            )}

            {/* 인증 폼 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  생년월일 확인
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  disabled={isAuthenticating || isLoadingReport}
                />
                <p className="text-sm text-gray-500">
                  분석 대상자의 생년월일을 입력해주세요
                </p>
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleAuthenticate}
                disabled={!birthDate || isAuthenticating || isLoadingReport}
                className="w-full"
              >
                {isAuthenticating || isLoadingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isAuthenticating ? '인증 중...' : '리포트 로딩 중...'}
                  </>
                ) : (
                  '리포트 열람하기'
                )}
              </Button>
            </div>

            {/* 안내 문구 */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>본 리포트는 개인정보보호를 위해 생년월일 확인이 필요합니다.</p>
              <p className="mt-1">문제가 있으시면 리포트 발송자에게 문의해주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 리포트 뷰어 화면
  if (step === 'viewing' && reportData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ReportViewerModal
          isOpen={true}
          onClose={() => navigate('/')}
          report={reportData}
          viewerId="basic-gemini-v1-web"
          viewerName="웹 뷰어"
        />
      </div>
    );
  }

  // 오류 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-red-600">오류 발생</CardTitle>
          <CardDescription>
            {authError || '알 수 없는 오류가 발생했습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            홈으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SharedReportPage; 