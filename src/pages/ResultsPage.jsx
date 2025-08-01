import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import useMp3Converter from '../hooks/useMp3Converter';
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

  // 평가 커스터마이제이션 상태
  const [evaluationDetail, setEvaluationDetail] = useState('detailed'); // brief, detailed, very-detailed
  const [additionalContext, setAdditionalContext] = useState(''); // Glossary/맥락

  // 평가 패키지 다운로드 기능
  const downloadEvaluationPackage = useCallback(async () => {
    if (!resultsData || !resultsData.audioData) return;

    setIsExporting(true);

    try {
      const { originalText, practiceSettings, mode } = resultsData;

      // MP3 변환 수행
      let finalAudioData = resultsData.audioData;
      let audioFileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.webm`;

      if (resultsData.audioData) {
        setShowConversionDialog(true);

        try {
          const mp3Blob = await convertToMp3(resultsData.audioData);
          if (mp3Blob) {
            finalAudioData = mp3Blob;
            audioFileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.mp3`;
          }
        } catch (err) {
          console.error('MP3 conversion failed, using original format:', err);
          // Continue with original audio if conversion fails
        }

        setShowConversionDialog(false);
      }

      // 고정된 평가 기준
      const criteriaText = `- Accuracy & Coverage: 내용 전달의 정확성과 완성도
- Delivery & Performance: 발표 속도, 유창함, 전달력  
- Natural Language: 언어의 자연스러움과 적절성`;

      const detailText = {
        'brief': '간략한 전반적인 피드백',
        'detailed': '구체적인 피드백과 개선 방향 제시',
        'very-detailed': '문장 단위로 개선 제안 및 개선안 제시'
      }[evaluationDetail];

      const evaluationContent = `=== 통역 연습 평가 요청 ===
연습 모드: ${mode === 'sight-translation' ? '시역 (Sight Translation)' : '동시통역 (Simultaneous Interpretation)'}
날짜: ${new Date().toLocaleString('ko-KR')}
${practiceSettings?.speed ? `속도: ${practiceSettings.speed} WPM` : ''}
${practiceSettings?.duration ? `녹음 시간: ${practiceSettings.duration}` : ''}

=== 원본 텍스트(한국어) ===
${originalText || '원본 텍스트가 없습니다.'}

=== 평가 요청 ===
첨부된 녹음 파일을 들어보시고 다음 기준으로 평가해주세요:

평가 기준:
${criteriaText}

평가 상세도: ${detailText}

${additionalContext ? `Glossary/추가 맥락:\n${additionalContext}\n\n` : ''}각 항목별 점수와 구체적인 피드백을 부탁드립니다.

---
Interpreter's Playground에서 생성됨
${window.location.origin}
`;

      // 파일 이름 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const textFileName = `evaluation_request_${timestamp}.txt`;

      // ZIP 파일 생성 및 다운로드
      const zip = new JSZip();

      // 1. 평가 요청 텍스트 추가
      zip.file(textFileName, evaluationContent);

      // 2. 녹음 파일 추가 (MP3 변환된 파일 또는 원본)
      zip.file(audioFileName, finalAudioData);

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `claude_evaluation_package_${timestamp}.zip`;

      const zipUrl = URL.createObjectURL(zipBlob);
      const zipLink = document.createElement('a');
      zipLink.href = zipUrl;
      zipLink.download = zipFileName;
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);
      URL.revokeObjectURL(zipUrl);

    } catch (error) {
      console.error('Export error:', error);
      alert('평가 패키지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [resultsData, evaluationDetail, additionalContext, convertToMp3]);

  // 평가 상세도 변경 핸들러
  const handleDetailChange = useCallback((detail) => {
    setEvaluationDetail(detail);
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
            className={`download-button ${!resultsData?.audioData ? 'disabled' : ''}`}
            onClick={downloadEvaluationPackage}
            disabled={isExporting || isConverting || !resultsData?.audioData}
          >
            {isConverting ? 'MP3 변환 중...' : isExporting ? '다운로드 중...' : '📦 평가용 파일 다운로드 (MP3)'}
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
        {/* 원본 텍스트 섹션 */}
        <div className="original-text-section">
          <h3>📄 원본 텍스트</h3>
          <div className="text-content original-text">
            {resultsData.originalText || '원본 텍스트가 없습니다.'}
          </div>
          <div className="text-info">
            글자 수: {resultsData.originalText?.length || 0}
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

        {/* 평가 설정 커스터마이제이션 */}
        <div className="evaluation-settings">
          <h3>⚙️ 평가 설정</h3>

          <div className="criteria-section">
            <h4>📊 평가 기준 (고정)</h4>
            <div className="fixed-criteria">
              <div className="criterion-item">
                <span className="criterion-icon">🎯</span>
                <div className="criterion-content">
                  <div className="criterion-title">Accuracy & Coverage</div>
                  <div className="criterion-desc">내용 전달의 정확성과 완성도</div>
                </div>
              </div>
              <div className="criterion-item">
                <span className="criterion-icon">🎤</span>
                <div className="criterion-content">
                  <div className="criterion-title">Delivery & Performance</div>
                  <div className="criterion-desc">발표 속도, 유창함, 전달력</div>
                </div>
              </div>
              <div className="criterion-item">
                <span className="criterion-icon">💬</span>
                <div className="criterion-content">
                  <div className="criterion-title">Natural Language</div>
                  <div className="criterion-desc">언어의 자연스러움과 적절성</div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>📋 평가 상세도</h4>
            <div className="detail-options">
              {[
                { key: 'brief', label: '간략한 피드백', desc: '전반적인 피드백과 핵심 포인트' },
                { key: 'detailed', label: '상세한 피드백', desc: '구체적인 피드백과 개선 방향 제시' },
                { key: 'very-detailed', label: '매우 상세한 피드백', desc: '문장 단위 개선 제안 및 개선안 제시' }
              ].map(detail => (
                <label key={detail.key} className="detail-radio">
                  <input
                    type="radio"
                    name="evaluationDetail"
                    value={detail.key}
                    checked={evaluationDetail === detail.key}
                    onChange={() => handleDetailChange(detail.key)}
                  />
                  <span className="radio-button"></span>
                  <div className="detail-info">
                    <div className="detail-label">{detail.label}</div>
                    <div className="detail-desc">{detail.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="additional-context">
            <h4>📚 Glossary/추가 맥락</h4>
            <textarea
              className="context-textarea"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="용어 및 특별한 맥락 정보 등을 입력하세요."
              rows={4}
            />
          </div>
        </div>

        {/* 아래쪽 액션 버튼들 */}
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