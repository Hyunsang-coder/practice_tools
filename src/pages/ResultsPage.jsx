import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useMp3Converter from '../hooks/useMp3Converter';
import useWhisper from '../hooks/useWhisper';
import ConversionProgressDialog from '../components/ConversionProgressDialog';
import './ResultsPage.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state;

  const [isExporting, setIsExporting] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);

  // MP3 변환 훅
  const {
    convertToMp3,
    isConverting,
    conversionProgress,
    error: conversionError,
    resetConverter
  } = useMp3Converter();

  // Whisper AI 전사 훅
  const {
    transcribe,
    isTranscribing,
    transcription,
    error: whisperError,
  } = useWhisper();

  const [transcribedText, setTranscribedText] = useState(''); // 전사된 텍스트
  const [transcriptionError, setTranscriptionError] = useState(null); // 전사 에러
  const [copySuccess, setCopySuccess] = useState(false); // 클립보드 복사 성공 상태

  const copyTimeoutRef = useRef(null);

  // 평가 항목 체크박스 상태
  const [evaluationCriteria, setEvaluationCriteria] = useState({
    coverage: true,        // 커버리지
    terminology: true,     // 용어 정확도
    segmentation: true,    // 분절
    fluency: true,         // 유창성
    style: true,           // 문체
    accuracy: true         // 정확성
  });


  // Whisper AI 전사 요청 핸들러
  const handleTranscription = useCallback(async () => {
    if (!resultsData?.audioData) {
      // setTranscriptionError('전사할 오디오 파일이 없습니다.'); // useWhisper hook will handle this error
      return;
    }

    try {
      // MP3 변환이 필요하다면 변환부터 수행
      let audioBlob = resultsData.audioData;
      let audioFileName = 'recording.webm'; // 기본 파일명

      if (audioBlob.type !== 'audio/mp3') {
        setShowConversionDialog(true);
        try {
          const mp3Blob = await convertToMp3(audioBlob);
          if (mp3Blob && mp3Blob.type === 'audio/mp3') {
            audioBlob = mp3Blob;
            audioFileName = 'recording.mp3';
          } else {
            console.warn('MP3 변환 실패, 원본 WebM 형식 사용');
            // 원본 형식 유지
          }
        } finally {
          setShowConversionDialog(false);
        }
      } else {
        audioFileName = 'recording.mp3';
      }

      const transcribedTextResult = await transcribe(audioBlob, audioFileName);
      if (transcribedTextResult) {
        setTranscribedText(transcribedTextResult);
      }

    } catch (error) {
      console.error('Transcription process error:', error);
      // Error will be set by useWhisper hook, or caught here if MP3 conversion fails
    }
  }, [resultsData, convertToMp3, transcribe]);

  // useWhisper 훅의 transcription과 error를 ResultsPage의 상태와 동기화
  useEffect(() => {
    if (transcription) {
      setTranscribedText(transcription);
    }
  }, [transcription]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (whisperError) {
      setTranscriptionError(whisperError);
    } else {
      setTranscriptionError(null);
    }
  }, [whisperError]);

  // Clean up transcription error when audio data changes or component unmounts
  useEffect(() => {
    return () => {
      setTranscriptionError(null);
    };
  }, [resultsData]);

  useEffect(() => {
    const audioUrl = resultsData?.audioUrl;
    if (!audioUrl) return undefined;

    return () => {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch (error) {
        console.warn('Audio URL revocation failed:', error);
      }
    };
  }, [resultsData?.audioUrl]);

  // 평가지 내용 생성 함수
  const generateEvaluationContent = useCallback(() => {
    if (!resultsData) return '';

    const { originalText, practiceSettings, mode } = resultsData;

    // 체크된 평가 항목들만 선택
    const selectedCriteria = [];
    const criteriaMap = {
      coverage: '커버리지',
      terminology: '용어 정확도',
      segmentation: '분절',
      fluency: '유창성',
      style: '문체',
      accuracy: '정확성'
    };

    Object.entries(evaluationCriteria).forEach(([key, checked]) => {
      if (checked) {
        selectedCriteria.push(criteriaMap[key]);
      }
    });

    // 선택된 항목이 없으면 기본값 설정
    const evaluationItems = selectedCriteria.length > 0
      ? selectedCriteria.join(', ')
      : '커버리지, 용어 정확도, 분절, 유창성, 문체, 정확성';

    return `시스템 프롬프트: 너는 경험이 많은 통번역대학원 한영과 교수야. 문장 구역에 대해 다음 평가 항목에 대해 간략히 크리틱을 할거야.
평가 항목: ${evaluationItems}

=== 원문 ===
${originalText || '원본 텍스트가 없습니다.'}

=== 통역 내용 (Whisper 전사) ===
${transcribedText || '전사된 텍스트가 없습니다. 먼저 "전사하기" 버튼을 클릭해주세요.'}

`;
  }, [resultsData, evaluationCriteria, transcribedText]);

  // 평가지 다운로드 (새로운 시스템 프롬프트 형식)
  const downloadEvaluationSheet = useCallback(async () => {
    if (!resultsData) return;

    setIsExporting(true);

    try {
      const evaluationContent = generateEvaluationContent();

      // 텍스트 파일 생성 및 다운로드
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const textFileName = `evaluation_sheet_${timestamp}.txt`;

      const textBlob = new Blob([evaluationContent], { type: 'text/plain;charset=utf-8' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = textFileName;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);

    } catch (error) {
      console.error('Evaluation sheet download error:', error);
      alert('평가지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [resultsData, generateEvaluationContent]);

  // 평가지 클립보드 복사
  const copyEvaluationToClipboard = useCallback(async () => {
    if (!resultsData || !transcribedText) return;

    try {
      const evaluationContent = generateEvaluationContent();

      if (navigator.clipboard && window.isSecureContext) {
        // 모던 브라우저에서 Clipboard API 사용
        await navigator.clipboard.writeText(evaluationContent);
      } else {
        // 폴백: 임시 textarea 사용
        const textArea = document.createElement('textarea');
        textArea.value = evaluationContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // 성공 피드백 표시
      setCopySuccess(true);

      // 기존 타이머 클리어
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // 새 타이머 설정
      copyTimeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
        copyTimeoutRef.current = null;
      }, 2000); // 2초 후 상태 리셋

    } catch (error) {
      console.error('Clipboard copy error:', error);
      alert('클립보드 복사 중 오류가 발생했습니다.');
    }
  }, [resultsData, transcribedText, generateEvaluationContent]);

  // 녹음 파일만 다운로드 (MP3 변환)
  const downloadAudioFile = useCallback(async () => {
    if (!resultsData?.audioData) return;

    setIsExporting(true);

    try {
      let finalAudioData = resultsData.audioData;
      let audioFileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.webm`;

      // MP3 변환 수행
      setShowConversionDialog(true);

      try {
        const mp3Blob = await convertToMp3(resultsData.audioData);
        if (mp3Blob && mp3Blob.type === 'audio/mp3') {
          finalAudioData = mp3Blob;
          audioFileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.mp3`;
        }
      } catch (err) {
        console.error('MP3 conversion failed, using original format:', err);
        // Continue with original audio if conversion fails
      }

      setShowConversionDialog(false);

      // 오디오 파일 직접 다운로드
      const audioUrl = URL.createObjectURL(finalAudioData);
      const audioLink = document.createElement('a');
      audioLink.href = audioUrl;
      audioLink.download = audioFileName;
      document.body.appendChild(audioLink);
      audioLink.click();
      document.body.removeChild(audioLink);
      URL.revokeObjectURL(audioUrl);

    } catch (error) {
      console.error('Audio download error:', error);
      alert('녹음 파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [resultsData, convertToMp3]);

  // 평가 항목 체크박스 변경 핸들러
  const handleCriteriaChange = useCallback((criteriaKey) => {
    setEvaluationCriteria(prev => ({
      ...prev,
      [criteriaKey]: !prev[criteriaKey]
    }));
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
            {resultsData.mode === 'sight-translation' ? '문장 구역 연습' : '동시통역 연습'} 결과를 확인하세요
          </p>
        </div>
        <div className="header-actions">
          <button
            className="home-button"
            onClick={() => navigate('/')}
          >
            🏠 홈으로
          </button>
        </div>
      </header>

      <main className="results-content">
        <div className="text-comparison-section">
          {/* 원본 텍스트 섹션 */}
          <div className="text-box original-text-section">
            <h3>📄 원본 텍스트</h3>
            <div className="text-content original-text">
              {resultsData.originalText || '원본 텍스트가 없습니다.'}
            </div>
            <div className="text-info">
              글자 수: {resultsData.originalText?.length || 0}
            </div>
          </div>

          {/* 통역 텍스트 섹션 (Whisper 전사) */}
          <div className="text-box transcribed-text-section">
            <div className="transcribed-header">
              <h3>🎙️ 통역 텍스트</h3>
              <button
                className="transcribe-button"
                onClick={handleTranscription}
                disabled={isTranscribing || !resultsData?.audioData}
              >
                {isTranscribing ? '전사 중...' : '✍️ 전사하기'}
              </button>
            </div>
            <textarea
              className="text-content transcribed-text"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="'전사하기' 버튼을 클릭하여 녹음 내용을 텍스트로 변환하세요. 변환된 내용은 여기서 직접 수정할 수 있습니다."
            />
            {transcriptionError && <div className="error-message">{transcriptionError}</div>}
          </div>
        </div>

        {/* 녹음 파일 섹션 */}
        <div className="audio-section">
          <h3>🎧 녹음 파일</h3>
          <div className="audio-player">
            {resultsData?.audioUrl ? (
              <audio src={resultsData.audioUrl} controls preload="metadata" />
            ) : resultsData?.audioData ? (
              <p className="no-audio-message">녹음 파일을 처리 중입니다...</p>
            ) : (
              <p className="no-audio-message">녹음 파일이 없습니다.</p>
            )}
          </div>

          {/* 오디오 다운로드 버튼 */}
          <div className="audio-download-section">
            <button
              className="audio-download-button"
              onClick={downloadAudioFile}
              disabled={isExporting || isConverting || !resultsData?.audioData}
            >
              {isConverting ? 'MP3 변환 중...' : isExporting ? '다운로드 중...' : '🎵 녹음 파일 다운로드 (MP3)'}
            </button>
          </div>
        </div>

        {/* 변환 오류 표시 */}
        {conversionError && (
          <div className="error-message" style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            margin: '1rem 0',
            border: '1px solid #fecaca'
          }}>
            {conversionError}
          </div>
        )}

        {/* 평가 설정 */}
        <div className="evaluation-settings">
          <h3>⚙️ 평가 설정</h3>

          <div className="criteria-section">
            <h4>📊 평가 항목</h4>
            <div className="criteria-checkboxes">
              {[
                { key: 'coverage', label: '커버리지', desc: '내용 전달의 완성도' },
                { key: 'terminology', label: '용어 정확도', desc: '전문 용어의 정확한 번역' },
                { key: 'segmentation', label: '분절', desc: '적절한 문장 분할과 구성' },
                { key: 'fluency', label: '유창성', desc: '자연스러운 발화와 흐름' },
                { key: 'style', label: '문체', desc: '상황에 맞는 언어 사용' },
                { key: 'accuracy', label: '정확성', desc: '의미 전달의 정확도' }
              ].map(criterion => (
                <label key={criterion.key} className="criteria-checkbox">
                  <input
                    type="checkbox"
                    checked={evaluationCriteria[criterion.key]}
                    onChange={() => handleCriteriaChange(criterion.key)}
                  />
                  <span className="checkbox-checkmark"></span>
                  <div className="criteria-info">
                    <div className="criteria-label">{criterion.label}</div>
                    <div className="criteria-desc">{criterion.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="evaluation-download-section">
            <div className="evaluation-buttons-row">
              <button
                className="evaluation-download-button"
                onClick={downloadEvaluationSheet}
                disabled={isExporting || !transcribedText}
              >
                {isExporting ? '다운로드 중...' : '📋 평가지 다운로드'}
              </button>
              <button
                className={`evaluation-copy-button ${copySuccess ? 'copy-success' : ''}`}
                onClick={copyEvaluationToClipboard}
                disabled={!transcribedText}
              >
                {copySuccess ? '✅ 복사됨!' : '📋 클립보드 복사'}
              </button>
            </div>
            {!transcribedText && (
              <p className="download-notice">
                평가지를 사용하려면 먼저 "전사하기" 버튼을 클릭해주세요.<br />
                평가지 내용을 ChatGPT에 입력하면 문장 구역에 대한 평가를 받을 수 있습니다.
              </p>
            )}
          </div>
        </div>

        {/* 아래쪽 액션 버튼들 */}
        <div className="action-section">
          <button
            className="retry-button"
            onClick={() => {
              // 원본 연습 데이터로 다시 연습하기
              if (resultsData.originalPracticeData) {
                navigate('/practice', { state: resultsData.originalPracticeData });
              } else {
                // fallback: 기본 설정으로 해당 모드 페이지로 이동
                navigate(resultsData.mode === 'sight-translation' ? '/sight-translation' : '/simultaneous');
              }
            }}
          >
            🔄 다시 연습하기
          </button>
          <button
            className="different-mode-button"
            onClick={() => navigate('/sight-translation')}
          >
            다른 연습으로
          </button>
        </div>
      </main>

      <ConversionProgressDialog
        isOpen={showConversionDialog}
        progress={conversionProgress}
        onCancel={() => {
          setShowConversionDialog(false);
          resetConverter();
        }}
      />
    </div>
  );
}

export default ResultsPage;
