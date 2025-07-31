import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResultsPage.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state;

  const [isExporting, setIsExporting] = useState(false);

  const exportResults = useCallback(() => {
    if (!resultsData) return;

    setIsExporting(true);

    try {
      const { originalText, userTranscript, practiceSettings, mode } = resultsData;
      
      const exportContent = `=== 통역 연습 결과 ===
연습 모드: ${mode === 'sight-translation' ? '시역 (Sight Translation)' : '동시통역 (Simultaneous Interpretation)'}
날짜: ${new Date().toLocaleString('ko-KR')}
${practiceSettings?.speed ? `속도: ${practiceSettings.speed}` : ''}
${practiceSettings?.duration ? `녹음 시간: ${practiceSettings.duration}` : ''}

=== 원본 텍스트 ===
${originalText || '원본 텍스트가 없습니다.'}

=== 통역 결과 ===
${userTranscript || '통역 결과가 없습니다.'}

=== 분석 ===
원본 글자 수: ${originalText?.length || 0}
통역 글자 수: ${userTranscript?.length || 0}
완성도: ${userTranscript ? Math.round((userTranscript.length / (originalText?.length || 1)) * 100) : 0}%

---
Interpreter's Playground에서 생성됨
${window.location.origin}
`;

      const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `통역연습결과_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [resultsData]);

  const calculateStats = useCallback(() => {
    if (!resultsData?.originalText || !resultsData?.userTranscript) {
      return { wordCount: 0, completeness: 0, efficiency: 0 };
    }

    const originalWords = resultsData.originalText.split(/\s+/).filter(word => word.length > 0);
    const transcriptWords = resultsData.userTranscript.split(/\s+/).filter(word => word.length > 0);
    
    const completeness = Math.round((transcriptWords.length / originalWords.length) * 100);
    const efficiency = resultsData.practiceSettings?.duration 
      ? Math.round(originalWords.length / (parseInt(resultsData.practiceSettings.duration.split(':')[0]) * 60 + parseInt(resultsData.practiceSettings.duration.split(':')[1])))
      : 0;

    return {
      originalWordCount: originalWords.length,
      transcriptWordCount: transcriptWords.length,
      completeness: Math.min(completeness, 100),
      efficiency
    };
  }, [resultsData]);

  if (!resultsData) {
    return (
      <div className="results-page error">
        <h1>오류</h1>
        <p>결과 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="header-content">
          <h1>연습 결과</h1>
          <p>
            {resultsData.mode === 'sight-translation' ? '시역 연습' : '동시통역 연습'} 결과를 확인하세요
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="export-button"
            onClick={exportResults}
            disabled={isExporting}
          >
            {isExporting ? '내보내는 중...' : '📄 결과 내보내기'}
          </button>
          <button 
            className="home-button"
            onClick={() => navigate('/')}
          >
            🏠 홈으로
          </button>
        </div>
      </header>

      <main className="results-content">
        <div className="stats-section">
          <h2>통계</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.originalWordCount}</div>
              <div className="stat-label">원본 단어 수</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.transcriptWordCount}</div>
              <div className="stat-label">통역 단어 수</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completeness}%</div>
              <div className="stat-label">완성도</div>
            </div>
            {resultsData.practiceSettings?.duration && (
              <div className="stat-card">
                <div className="stat-value">{resultsData.practiceSettings.duration}</div>
                <div className="stat-label">소요 시간</div>
              </div>
            )}
          </div>
        </div>

        <div className="comparison-section">
          <div className="text-panels">
            <div className="text-panel original">
              <h3>원본 텍스트</h3>
              <div className="text-content">
                {resultsData.originalText || '원본 텍스트가 없습니다.'}
              </div>
              <div className="text-info">
                글자 수: {resultsData.originalText?.length || 0}
              </div>
            </div>

            <div className="text-panel translation">
              <h3>통역 결과</h3>
              <div className="text-content">
                {resultsData.userTranscript || '통역 결과가 없습니다.'}
              </div>
              <div className="text-info">
                글자 수: {resultsData.userTranscript?.length || 0}
              </div>
              
              {resultsData.audioUrl && (
                <div className="audio-playback">
                  <h4>녹음 재생</h4>
                  <audio src={resultsData.audioUrl} controls />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="analysis-section">
          <h2>분석 및 개선점</h2>
          <div className="analysis-content">
            <div className="analysis-item">
              <h4>완성도 분석</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.completeness}%` }}
                />
                <span className="progress-text">{stats.completeness}%</span>
              </div>
              <p>
                {stats.completeness >= 80 
                  ? "🎉 훌륭합니다! 높은 완성도를 보여주었습니다."
                  : stats.completeness >= 60
                  ? "👍 좋은 결과입니다. 조금 더 완전한 통역을 목표로 해보세요."
                  : "💪 더 연습이 필요합니다. 천천히 정확하게 통역해보세요."
                }
              </p>
            </div>

            <div className="analysis-item">
              <h4>개선 제안</h4>
              <ul className="suggestions">
                {stats.completeness < 70 && (
                  <li>더 완전한 문장으로 통역해보세요.</li>
                )}
                {stats.transcriptWordCount < stats.originalWordCount * 0.5 && (
                  <li>내용을 더 풍부하게 표현해보세요.</li>
                )}
                {resultsData.mode === 'sight-translation' && (
                  <li>롤링 속도를 조정하여 자신에게 맞는 페이스를 찾아보세요.</li>
                )}
                {resultsData.mode === 'simultaneous' && (
                  <li>재생 속도를 조정하여 단계적으로 연습해보세요.</li>
                )}
                <li>반복 연습을 통해 유창성을 향상시켜보세요.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="action-section">
          <button 
            className="retry-button"
            onClick={() => navigate(resultsData.mode === 'sight-translation' ? '/sight-translation' : '/simultaneous')}
          >
            🔄 다시 연습하기
          </button>
          <button 
            className="different-mode-button"
            onClick={() => navigate(resultsData.mode === 'sight-translation' ? '/simultaneous' : '/sight-translation')}
          >
            {resultsData.mode === 'sight-translation' ? '🎥 동시통역 연습' : '📖 시역 연습'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;