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

  if (!resultsData) {
    return (
      <div className="results-page error">
        <h1>오류</h1>
        <p>결과 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

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
              <h3>통역 텍스트</h3>
              <div className="text-content">
                {resultsData.userTranscript || '통역 텍스트가 없습니다.'}
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