import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_TEXTS } from '../data/sampleTexts';
import styles from './SightTranslationPage.module.css';

const BASE_WPM = 100; // 기본 100 WPM

function SightTranslationPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [speed] = useState(1.0);
  const [useCustomText, setUseCustomText] = useState(true);

  const handleSampleSelect = (sampleId) => {
    const sample = SAMPLE_TEXTS.find(s => s.id === parseInt(sampleId));
    setSelectedSample(sampleId);
    setInputText(sample ? sample.content : '');
    setUseCustomText(false);
  };

  const handleCustomTextChange = (text) => {
    setInputText(text);
    setSelectedSample('');
    setUseCustomText(true);
  };

  const handleStartPractice = () => {
    if (!inputText.trim()) {
      alert('연습할 텍스트를 입력하거나 샘플을 선택해주세요.');
      return;
    }

    // 텍스트 정리: 불필요한 공백, 줄바꿈, 탭 제거
    const cleanedText = inputText
      .replace(/\s+/g, ' ')  // 연속된 공백을 하나로
      .trim();               // 앞뒤 공백 제거

    const practiceData = {
      mode: 'sight-translation',
      text: cleanedText,
      speed: speed,
      speedWpm: BASE_WPM * speed
    };

    navigate('/practice', { state: practiceData });
  };

  return (
    <div className={styles.sightTranslationPage}>
      <header className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          🏠 홈으로
        </button>
        <h1>문장 구역 연습 준비</h1>
        <p>연습할 텍스트와 설정을 선택하세요</p>
      </header>

      <main className={styles.preparationContent}>
        <div className={styles.textSelectionSection}>
          <h2 className={styles.textSettingsSectionTitle}>텍스트 표시 설정</h2>

          <div className={styles.inputOptions}>
            <div className={styles.optionTabs}>
              <button
                className={`${styles.tab} ${useCustomText ? styles.active : ''}`}
                onClick={() => {
                  setUseCustomText(true);
                  setSelectedSample('');
                }}
              >
                직접 입력
              </button>
              <button
                className={`${styles.tab} ${!useCustomText ? styles.active : ''}`}
                onClick={() => setUseCustomText(false)}
              >
                샘플 선택
              </button>
            </div>

            {useCustomText ? (
              <div className={styles.customInput}>
                <textarea
                  value={inputText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  placeholder="연습하고 싶은 한국어 텍스트를 입력하세요..."
                  rows={10}
                  className={styles.textInput}
                />
                <div className={styles.textInfo}>
                  글자 수: {inputText.length} | 예상 소요 시간: {inputText.length > 0 ? Math.ceil(inputText.length / (BASE_WPM * speed) * 60) : 0}초
                </div>
              </div>
            ) : (
              <div className={styles.sampleSelection}>
                <select
                  value={selectedSample}
                  onChange={(e) => handleSampleSelect(e.target.value)}
                  className={styles.sampleSelect}
                >
                  <option value="">샘플 텍스트를 선택하세요</option>
                  {SAMPLE_TEXTS.map(sample => (
                    <option key={sample.id} value={sample.id}>
                      {sample.title}
                    </option>
                  ))}
                </select>

                {selectedSample && (
                  <div className={styles.samplePreview}>
                    <h4>미리보기:</h4>
                    <p>{inputText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.practiceInfo}>
            <h3>연습 방법</h3>
            <ul>
              <li>텍스트가 자동으로 롤링 하이라이트됩니다</li>
              <li>하이라이트된 부분을 보며 통역하세요</li>
              <li>녹음 버튼을 눌러 통역을 녹음할 수 있습니다</li>
              <li>연습 완료 후 녹음과 리뷰용 텍스트 파일을 다운로드할 수 있습니다</li>
              <li>리뷰용 텍스트 파일을 GPT에 복붙하면 리뷰를 받을 수 있습니다</li>
            </ul>
          </div>
        </div>

        <div className={styles.actionSection}>
          <button
            className={styles.startPracticeButton}
            onClick={handleStartPractice}
            disabled={!inputText.trim()}
          >
            연습 시작하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default SightTranslationPage;
