import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import './ResultsPage.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state;

  const [isExporting, setIsExporting] = useState(false);
  // 평가 커스터마이제이션 상태
  const [evaluationCriteria, setEvaluationCriteria] = useState({
    accuracy: true,
    fluency: true,
    naturalness: true,
    cultural: false,
    terminology: false,
    emotion: false,
    structure: false
  });
  const [evaluationFormat, setEvaluationFormat] = useState('score-feedback');
  const [additionalRequests, setAdditionalRequests] = useState('');

  // 평가 패키지 다운로드 기능
  const downloadEvaluationPackage = useCallback(async () => {
    if (!resultsData || !resultsData.audioData) return;

    setIsExporting(true);

    try {
      const { originalText, practiceSettings, mode } = resultsData;
      
      // 평가 기준 텍스트 생성
      const criteriaText = Object.entries(evaluationCriteria)
        .filter(([, selected]) => selected)
        .map(([key]) => {
          const criteriaNames = {
            accuracy: '내용 전달 정확성',
            fluency: '전달 속도와 유창함',
            naturalness: '언어의 자연스러움',
            cultural: '문화적 맥락 이해',
            terminology: '전문용어 정확성',
            emotion: '감정/톤 전달',
            structure: '논리적 구조'
          };
          return `- ${criteriaNames[key]}`;
        }).join('\n');

      const formatText = {
        'score-feedback': '점수 + 피드백 (1-10점 + 상세 코멘트)',
        'grade': '등급 평가 (A-F + 개선점)',
        'free-form': '자유형 평가 (전체적인 총평)'
      }[evaluationFormat];
      
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

평가 형식: ${formatText}

${additionalRequests ? `추가 요청사항:\n${additionalRequests}\n\n` : ''}각 항목별 점수와 구체적인 피드백을 부탁드립니다.

---
Interpreter's Playground에서 생성됨
${window.location.origin}
`;

      // 녹음 파일 이름 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const audioFileName = `recording_${timestamp}.webm`;
      const textFileName = `evaluation_request_${timestamp}.txt`;

      // ZIP 파일 생성 및 다운로드
      const zip = new JSZip();
      
      // 1. 평가 요청 텍스트 추가
      zip.file(textFileName, evaluationContent);
      
      // 2. 녹음 파일 추가
      zip.file(audioFileName, resultsData.audioData);
      
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
  }, [resultsData, evaluationCriteria, evaluationFormat, additionalRequests]);

  // 평가 기준 변경 핸들러
  const handleCriteriaChange = useCallback((criteriaKey) => {
    setEvaluationCriteria(prev => ({
      ...prev,
      [criteriaKey]: !prev[criteriaKey]
    }));
  }, []);

  // 평가 형식 변경 핸들러
  const handleFormatChange = useCallback((format) => {
    setEvaluationFormat(format);
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
            disabled={isExporting || !resultsData?.audioData}
          >
            {isExporting ? '다운로드 중...' : '📦 Claude 평가 패키지 다운로드'}
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
        {resultsData.audioUrl && (
          <div className="audio-section">
            <h3>🎧 녹음 파일</h3>
            <div className="audio-player">
              <audio src={resultsData.audioUrl} controls preload="metadata" />
              {resultsData?.audioData && (
                <div className="audio-info">
                  파일 정보: {resultsData.audioData.type || 'unknown'} ({(resultsData.audioData.size / 1024).toFixed(1)}KB)
                </div>
              )}
            </div>
          </div>
        )}

        {/* 평가 설정 커스터마이제이션 */}
        <div className="evaluation-settings">
          <h3>⚙️ 평가 설정 커스터마이제이션</h3>
          
          <div className="criteria-section">
            <h4>평가 기준 선택</h4>
            <div className="criteria-grid">
              {[
                { key: 'accuracy', label: '내용 전달 정확성', default: true },
                { key: 'fluency', label: '전달 속도와 유창함', default: true },
                { key: 'naturalness', label: '언어의 자연스러움', default: true },
                { key: 'cultural', label: '문화적 맥락 이해', default: false },
                { key: 'terminology', label: '전문용어 정확성', default: false },
                { key: 'emotion', label: '감정/톤 전달', default: false },
                { key: 'structure', label: '논리적 구조', default: false }
              ].map(criterion => (
                <label key={criterion.key} className="criterion-checkbox">
                  <input
                    type="checkbox"
                    checked={evaluationCriteria[criterion.key]}
                    onChange={() => handleCriteriaChange(criterion.key)}
                  />
                  <span className="checkmark"></span>
                  {criterion.label}
                  {criterion.default && <span className="default-tag">기본</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="format-section">
            <h4>평가 형식</h4>
            <div className="format-options">
              {[
                { key: 'score-feedback', label: '점수 + 피드백', desc: '1-10점 + 상세 코멘트' },
                { key: 'grade', label: '등급 평가', desc: 'A-F + 개선점' },
                { key: 'free-form', label: '자유형 평가', desc: '전체적인 총평' }
              ].map(format => (
                <label key={format.key} className="format-radio">
                  <input
                    type="radio"
                    name="evaluationFormat"
                    value={format.key}
                    checked={evaluationFormat === format.key}
                    onChange={() => handleFormatChange(format.key)}
                  />
                  <span className="radio-button"></span>
                  <div className="format-info">
                    <div className="format-label">{format.label}</div>
                    <div className="format-desc">{format.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="additional-requests">
            <h4>추가 요청사항</h4>
            <textarea
              className="additional-textarea"
              value={additionalRequests}
              onChange={(e) => setAdditionalRequests(e.target.value)}
              placeholder="특별히 주의 깊게 보고 싶은 부분이나 추가 요청사항을 입력하세요."
              rows={3}
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
    </div>
  );
}

export default ResultsPage;