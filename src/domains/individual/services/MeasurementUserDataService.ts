import { where } from 'firebase/firestore';
import { FirebaseService } from '@core/services/FirebaseService';
import measurementUserManagementService, { MeasurementUser } from './MeasurementUserManagementService';

/**
 * MeasurementUser 중심의 통합 데이터 조회 서비스
 * 사용자의 모든 건강 관련 데이터를 한 곳에서 조회할 수 있도록 함
 */
export class MeasurementUserDataService {

  /**
   * 사용자의 모든 AI 분석 결과 조회
   */
  async getAIAnalysisResults(measurementUserId: string) {
    try {
      console.log('AI 분석 결과 조회 시작:', {
        metadata: {
          measurementUserId
        }
      });
      
      const results = await FirebaseService.getDocuments('ai_analysis_results', [
        where('measurementUserId', '==', measurementUserId)
      ]);
      
      console.log('AI 분석 결과 조회 완료:', {
        metadata: {
          measurementUserId,
          resultCount: results.length
        }
      });
      return results;
      
    } catch (error) {
      console.error('AI 분석 결과 조회 중 오류:', error, {
        metadata: {
          measurementUserId
        }
      });
      throw error;
    }
  }

  /**
   * 사용자의 모든 측정 세션 조회
   */
  async getMeasurementSessions(measurementUserId: string) {
    try {
      console.log('측정 세션 조회 시작:', {
        metadata: {
          measurementUserId
        }
      });
      
      // measurementUserId 또는 subjectEmail로 검색
      const measurementUser = await measurementUserManagementService.getMeasurementUser(measurementUserId);
      if (!measurementUser) {
        console.warn('측정 대상자를 찾을 수 없음:', {
          metadata: {
            measurementUserId
          }
        });
        return [];
      }
      
      // 이메일 기준으로 세션 검색 (기존 데이터 호환성)
      const sessions = await FirebaseService.getDocuments('measurementSessions', [
        where('subjectEmail', '==', measurementUser.email)
      ]);
      
      console.log('측정 세션 조회 완료:', {
        metadata: {
          measurementUserId,
          sessionCount: sessions.length,
          userEmail: measurementUser?.email
        }
      });
      return sessions;
      
    } catch (error) {
      console.error('AI 분석 결과 조회 중 오류:', error, {
        metadata: {
          measurementUserId
        }
      });
      throw error;
    }
  }

  /**
   * 사용자의 공유 리포트 조회
   */
  async getSharedReports(measurementUserId: string) {
    try {
      console.log('공유 리포트 조회 시작:', {
        metadata: {
          measurementUserId
        }
      });
      
      const sharedReports = await FirebaseService.getDocuments('shared_reports', [
        where('measurementUserId', '==', measurementUserId)
      ]);
      
      console.log('공유 리포트 조회 성공:', {
        metadata: {
          measurementUserId,
          reportCount: sharedReports.length
        }
      });
      return sharedReports;
      
    } catch (error) {
      console.warn('공유 리포트 조회 실패 - 빈 배열 반환:', {
        metadata: {
          measurementUserId
        }
      });
      // shared_reports에 measurementUserId 필드가 없을 수 있으므로 빈 배열 반환
      console.log('공유 리포트 조회 실패 세부 사항:', {
        metadata: {
          measurementUserId
        }
      });
      return [];
    }
  }

  /**
   * 사용자의 전체 건강 이력 조회 (통합)
   */
  async getUserHealthHistory(measurementUserId: string) {
    try {
      console.log('사용자 건강 이력 통합 조회 시작:', {
        metadata: {
          measurementUserId
        }
      });
      
      const [measurementUser, analysisResults, sessions, sharedReports] = await Promise.all([
        measurementUserManagementService.getMeasurementUser(measurementUserId),
        this.getAIAnalysisResults(measurementUserId),
        this.getMeasurementSessions(measurementUserId),
        this.getSharedReports(measurementUserId)
      ]);
      
      if (!measurementUser) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
             // 시간순으로 정렬
       const sortedAnalysisResults = analysisResults.sort((a: any, b: any) => {
         const timeA = a.timestamp || a.createdAt || new Date(0);
         const timeB = b.timestamp || b.createdAt || new Date(0);
         return new Date(timeB).getTime() - new Date(timeA).getTime();
       });
       
       const sortedSessions = sessions.sort((a: any, b: any) => {
         const timeA = a.sessionDate || a.createdAt || new Date(0);
         const timeB = b.sessionDate || b.createdAt || new Date(0);
         return new Date(timeB).getTime() - new Date(timeA).getTime();
       });
      
      const healthHistory = {
        measurementUser,
        analysisResults: sortedAnalysisResults,
        sessions: sortedSessions,
        sharedReports,
        statistics: {
          totalMeasurements: sessions.length,
          totalReports: analysisResults.length,
          totalSharedReports: sharedReports.length,
          lastMeasurementDate: measurementUser.lastMeasurementDate,
          lastReportDate: measurementUser.lastReportDate,
          averageScores: this.calculateAverageScores(analysisResults),
          measurementFrequency: this.calculateMeasurementFrequency(sessions)
        }
      };
      
      console.log('사용자 건강 이력 통합 조회 완료:', {
        metadata: {
          userId: measurementUserId,
          totalMeasurements: healthHistory.statistics.totalMeasurements,
          totalReports: healthHistory.statistics.totalReports,
          totalSharedReports: healthHistory.statistics.totalSharedReports
        }
      });
      
      return healthHistory;
      
    } catch (error) {
      console.error('AI 분석 결과 조회 중 오류:', error, {
        metadata: {
          measurementUserId
        }
      });
      throw error;
    }
  }

  /**
   * 분석 결과들의 평균 점수 계산
   */
  private calculateAverageScores(analysisResults: any[]): any {
    if (analysisResults.length === 0) {
      return {
        overallScore: 0,
        stressLevel: 0,
        focusLevel: 0,
        dataCount: 0
      };
    }
    
    const totals = analysisResults.reduce((acc, result) => {
      acc.overallScore += result.overallScore || 0;
      acc.stressLevel += result.stressLevel || 0;
      acc.focusLevel += result.focusLevel || 0;
      return acc;
    }, { overallScore: 0, stressLevel: 0, focusLevel: 0 });
    
    const count = analysisResults.length;
    
    return {
      overallScore: Math.round(totals.overallScore / count),
      stressLevel: Math.round(totals.stressLevel / count),
      focusLevel: Math.round(totals.focusLevel / count),
      dataCount: count
    };
  }

  /**
   * 측정 빈도 계산 (최근 30일 기준)
   */
  private calculateMeasurementFrequency(sessions: any[]): any {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = sessions.filter(session => {
      const sessionDate = session.sessionDate || session.createdAt;
      return sessionDate && new Date(sessionDate) >= thirtyDaysAgo;
    });
    
    const frequency = recentSessions.length / 30; // 일평균 측정 횟수
    
    return {
      last30Days: recentSessions.length,
      dailyAverage: Math.round(frequency * 100) / 100,
      weeklyAverage: Math.round(frequency * 7 * 100) / 100
    };
  }

  /**
   * 사용자별 요약 통계 조회
   */
  async getUserSummaryStats(measurementUserId: string) {
    try {
      const [analysisResults, sessions] = await Promise.all([
        this.getAIAnalysisResults(measurementUserId),
        this.getMeasurementSessions(measurementUserId)
      ]);
      
      const averageScores = this.calculateAverageScores(analysisResults);
      const frequency = this.calculateMeasurementFrequency(sessions);
      
      return {
        totalMeasurements: sessions.length,
        totalReports: analysisResults.length,
        averageScores,
        measurementFrequency: frequency,
        lastActivity: sessions.length > 0 ? 
          Math.max(...sessions.map((s: any) => new Date(s.sessionDate || s.createdAt || 0).getTime())) : 
          null
      };
      
    } catch (error) {
      console.error('AI 분석 결과 조회 중 오류:', error, {
        metadata: {
          measurementUserId
        }
      });
      throw error;
    }
  }

  /**
   * 조직 내 모든 사용자의 건강 데이터 조회 (관리자용)
   */
  async getOrganizationHealthData(organizationId: string) {
    try {
      console.log('조직 건강 데이터 조회 시작:', {
        metadata: {
          organizationId
        }
      });
      
      // 조직의 모든 MeasurementUser 조회
      const measurementUsers = await measurementUserManagementService.getMeasurementUsers({
        organizationId
      });
      
      // 각 사용자별 요약 통계 조회
      const userHealthData = await Promise.all(
        measurementUsers.map(async (user) => {
          try {
            const stats = await this.getUserSummaryStats(user.id);
            return {
              user,
              stats,
              hasData: stats.totalMeasurements > 0
            };
          } catch (error) {
            console.warn('사용자별 통계 조회 실패:', {
              metadata: {
                userId: user.id,
                userEmail: user.email,
                error: error instanceof Error ? error.message : String(error)
              }
            });
            return {
              user,
              stats: null,
              hasData: false
            };
          }
        })
      );
      
      const organizationStats = {
        totalUsers: measurementUsers.length,
        activeUsers: userHealthData.filter(u => u.hasData).length,
        totalMeasurements: userHealthData.reduce((sum, u) => sum + (u.stats?.totalMeasurements || 0), 0),
        totalReports: userHealthData.reduce((sum, u) => sum + (u.stats?.totalReports || 0), 0),
        averageScoresAcrossUsers: this.calculateOrganizationAverages(userHealthData)
      };
      
      console.log('조직 건강 데이터 조회 완료:', organizationStats);
      
      return {
        organizationStats,
        userHealthData: userHealthData.filter(u => u.hasData), // 데이터가 있는 사용자만 반환
        allUsers: userHealthData // 모든 사용자 (데이터 없는 사용자 포함)
      };
      
    } catch (error) {
      console.error('조직 건강 데이터 조회 오류:', error, {
        metadata: {
          organizationId
        }
      });
      throw error;
    }
  }

  /**
   * 조직 전체 평균 점수 계산
   */
  private calculateOrganizationAverages(userHealthData: any[]): any {
    const usersWithData = userHealthData.filter(u => u.stats && u.stats.averageScores.dataCount > 0);
    
    if (usersWithData.length === 0) {
      return {
        overallScore: 0,
        stressLevel: 0,
        focusLevel: 0,
        userCount: 0
      };
    }
    
    const totals = usersWithData.reduce((acc, userData) => {
      const scores = userData.stats.averageScores;
      acc.overallScore += scores.overallScore || 0;
      acc.stressLevel += scores.stressLevel || 0;
      acc.focusLevel += scores.focusLevel || 0;
      return acc;
    }, { overallScore: 0, stressLevel: 0, focusLevel: 0 });
    
    const count = usersWithData.length;
    
    return {
      overallScore: Math.round(totals.overallScore / count),
      stressLevel: Math.round(totals.stressLevel / count),
      focusLevel: Math.round(totals.focusLevel / count),
      userCount: count
    };
  }
}

// 싱글톤 인스턴스 생성
const measurementUserDataService = new MeasurementUserDataService();
export default measurementUserDataService; 