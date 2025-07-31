import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useWhisper from '../hooks/useWhisper';
import './ResultsPage.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state;

  const [isExporting, setIsExporting] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState(resultsData?.userTranscript || '');
  
  // React Hook 규칙에 따라 항상 훅을 호출
  const {
    isLoading: isTranscribing,
    transcribeAudio,
    error: transcribeError
  } = useWhisper();

  const exportResults = useCallback(() => {
    if (!resultsData) return;

    setIsExporting(true);

    try {
      const { originalText, practiceSettings, mode } = resultsData;
      const userTranscript = editableTranscript; // 편집 가능한 내용을 사용
      
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
  }, [resultsData, editableTranscript]);

  const handleTranscribe = useCallback(async () => {
    // audioData 유효성 검사 강화
    if (!resultsData) {
      alert('연습 데이터가 없습니다. 다시 연습해주세요.');
      return;
    }

    if (!resultsData.audioData) {
      alert('녹음 데이터가 없습니다. 연습에서 녹음을 먼저 해주세요.');
      return;
    }

    // Blob 객체 유효성 검사
    if (!(resultsData.audioData instanceof Blob)) {
      alert('녹음 데이터 형식이 올바르지 않습니다. 다시 녹음해주세요.');
      return;
    }

    // 오디오 크기 확인 (너무 작으면 빈 녹음일 가능성)
    if (resultsData.audioData.size < 1000) {
      alert('녹음 데이터가 너무 작습니다 (${resultsData.audioData.size} bytes). 말을 하면서 녹음했는지 확인해주세요.');
      return;
    }

    console.log('audioData 검증 성공:', {
      type: resultsData.audioData.type,
      size: resultsData.audioData.size,
      isBlob: resultsData.audioData instanceof Blob
    });

    if (!transcribeAudio) {
      alert('전사 기능을 사용할 수 없습니다.');
      return;
    }

    try {
      const transcript = await transcribeAudio(resultsData.audioData, 'ko-KR');
      setEditableTranscript(transcript);
    } catch (error) {
      console.error('Transcribe error:', error);
      // 사용자 친화적 오류 메시지 표시
      alert(error.message || '전사 중 오류가 발생했습니다.');
    }
  }, [resultsData?.audioData, transcribeAudio]);

  // 오류 메시지를 사용자 친화적으로 변환
  const getDisplayError = useCallback((error) => {
    if (!error) return null;
    
    const errorString = error.toString().toLowerCase();
    
    if (errorString.includes('no-speech') || errorString.includes('음성을 찾을 수 없습니다')) {
      return '녹음에서 음성을 찾을 수 없습니다. 말을 하면서 녹음했는지 확인해주세요.';
    }
    
    if (errorString.includes('audio-capture') || errorString.includes('마이크')) {
      return '마이크 접근에 문제가 있습니다. 마이크 권한을 확인해주세요.';
    }
    
    if (errorString.includes('not-allowed') || errorString.includes('권한')) {
      return '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
    }
    
    if (errorString.includes('network') || errorString.includes('네트워크')) {
      return '네트워크 오류로 인해 전사에 실패했습니다. 인터넷 연결을 확인해주세요.';
    }
    
    if (errorString.includes('timeout') || errorString.includes('타임아웃')) {
      return '전사 시간이 초과되었습니다. 현재는 모의 기능으로 동작합니다. 실제 구현에서는 Whisper.wasm을 사용하여 정확한 한국어 인식을 제공합니다.';
    }
    
    // 기본 오류 메시지 (모의 기능 안내)
    return '현재는 모의 전사 기능으로 동작합니다. 실제 구현에서는 Whisper.wasm을 사용하여 정확한 한국어 인식을 제공할 예정입니다.';
  }, []);

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
              <div className="translation-header">
                <h3>통역 텍스트</h3>
                <button 
                  className={`transcribe-button ${!resultsData?.audioData ? 'disabled' : ''}`}
                  onClick={handleTranscribe}
                  disabled={isTranscribing || !resultsData?.audioData}
                >
                  {isTranscribing ? '전사 중...' : '🎤 전사하기'}
                </button>
              </div>
              
              <textarea
                className="transcript-textarea"
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                placeholder="전사하기 버튼을 눌러 녹음을 텍스트로 변환하거나 직접 입력하세요."
                rows={8}
              />
              
              {transcribeError && (
                <div className="error-message">
                  {getDisplayError(transcribeError)}
                </div>
              )}
              
              <div className="text-info">
                글자 수: {editableTranscript?.length || 0}
              </div>
              
              {resultsData.audioUrl && (
                <div className="audio-playback">
                  <h4>녹음 재생</h4>
                  <audio src={resultsData.audioUrl} controls />
                  {/* 디버깅 정보 */}
                  {resultsData?.audioData && (
                    <div className="audio-debug-info" style={{fontSize: '0.8rem', color: '#666', marginTop: '0.5rem'}}>
                      파일 정보: {resultsData.audioData.type || 'unknown'} ({(resultsData.audioData.size / 1024).toFixed(1)}KB)
                    </div>
                  )}
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