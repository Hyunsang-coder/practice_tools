import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SightTranslationPage.css';

const SAMPLE_TEXTS = [
  {
    id: 1,
    title: "뉴스 - 기술 혁신",
    content: `인공지능 기술의 발전이 우리 일상생활에 미치는 영향이 점점 커지고 있습니다. 최근 발표된 연구에 따르면, AI 기술은 의료, 교육, 금융 등 다양한 분야에서 혁신적인 변화를 이끌고 있습니다. 특히 의료 분야에서는 질병 진단의 정확도가 크게 향상되었으며, 교육 분야에서는 개인 맞춤형 학습이 가능해졌습니다.`
  },
  {
    id: 2,
    title: "연설문 - 환경 보호",
    content: `기후 변화는 21세기 인류가 직면한 가장 심각한 도전 중 하나입니다. 우리는 지금 당장 행동해야 합니다. 재생 가능 에너지로의 전환, 탄소 배출량 감소, 지속 가능한 생활 방식의 채택이 필요합니다. 정부, 기업, 시민 모두가 함께 노력해야만 우리의 지구를 미래 세대에게 온전히 물려줄 수 있습니다.`
  },
  {
    id: 3,
    title: "학술 논문 - 경제학",
    content: `글로벌 경제의 디지털화는 전통적인 비즈니스 모델에 근본적인 변화를 요구하고 있습니다. 전자상거래의 급속한 성장, 핀테크 혁신, 그리고 암호화폐의 등장은 금융 시스템의 패러다임을 바꾸고 있습니다. 이러한 변화는 새로운 기회를 창출하는 동시에 기존 산업구조에 도전장을 내밀고 있습니다.`
  }
];

const BASE_WPM = 100; // 기본 100 WPM

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5배 (50 WPM)', wpm: BASE_WPM * 0.5 },
  { value: 0.7, label: '0.7배 (70 WPM)', wpm: BASE_WPM * 0.7 },
  { value: 0.9, label: '0.9배 (90 WPM)', wpm: BASE_WPM * 0.9 },
  { value: 1.0, label: '1.0배 (100 WPM)', wpm: BASE_WPM * 1.0 },
  { value: 1.3, label: '1.3배 (130 WPM)', wpm: BASE_WPM * 1.3 },
  { value: 1.5, label: '1.5배 (150 WPM)', wpm: BASE_WPM * 1.5 }
];

function SightTranslationPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [speed, setSpeed] = useState(1.0);
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

    const practiceData = {
      mode: 'sight-translation',
      text: inputText,
      speed: speed,
      speedWpm: BASE_WPM * speed
    };

    navigate('/practice', { state: practiceData });
  };

  return (
    <div className="sight-translation-page">
      <header className="page-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 홈으로
        </button>
        <h1>시역 연습 준비</h1>
        <p>연습할 텍스트와 설정을 선택하세요</p>
      </header>

      <main className="preparation-content">
        <div className="text-selection-section">
          <h2>텍스트 선택</h2>

          <div className="input-options">
            <div className="option-tabs">
              <button
                className={`tab ${useCustomText ? 'active' : ''}`}
                onClick={() => {
                  setUseCustomText(true);
                  setSelectedSample('');
                }}
              >
                직접 입력
              </button>
              <button
                className={`tab ${!useCustomText ? 'active' : ''}`}
                onClick={() => setUseCustomText(false)}
              >
                샘플 선택
              </button>
            </div>

            {useCustomText ? (
              <div className="custom-input">
                <textarea
                  value={inputText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  placeholder="연습하고 싶은 한국어 텍스트를 입력하세요..."
                  rows={10}
                  className="text-input"
                />
                <div className="text-info">
                  글자 수: {inputText.length} | 예상 소요 시간: {Math.ceil(inputText.length / 10)}초
                </div>
              </div>
            ) : (
              <div className="sample-selection">
                <select
                  value={selectedSample}
                  onChange={(e) => handleSampleSelect(e.target.value)}
                  className="sample-select"
                >
                  <option value="">샘플 텍스트를 선택하세요</option>
                  {SAMPLE_TEXTS.map(sample => (
                    <option key={sample.id} value={sample.id}>
                      {sample.title}
                    </option>
                  ))}
                </select>

                {selectedSample && (
                  <div className="sample-preview">
                    <h4>미리보기:</h4>
                    <p>{inputText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>연습 설정</h2>

          <div className="speed-selection">
            <h3>페이싱 속도</h3>
            <div className="speed-slider-container">
              <label className="speed-display">
                {speed}배 ({Math.round(BASE_WPM * speed)} WPM)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="speed-slider-setup"
              />
              <div className="speed-markers">
                <span>0.5배</span>
                <span>1.0배</span>
                <span>1.5배</span>
              </div>
            </div>
          </div>

          <div className="practice-info">
            <h3>연습 방법</h3>
            <ul>
              <li>텍스트가 자동으로 롤링 하이라이트됩니다</li>
              <li>하이라이트된 부분을 보며 영어로 통역하세요</li>
              <li>녹음 버튼을 눌러 통역 내용을 기록할 수 있습니다</li>
              <li>연습 완료 후 결과를 확인하고 내보낼 수 있습니다</li>
            </ul>
          </div>
        </div>

        <div className="action-section">
          <button
            className="start-practice-button"
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