import { useNavigate } from 'react-router-dom';
import EnvDebugger from '../components/EnvDebugger';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <header className="hero-section">
        <h1 className="main-title">Interpreter's Playground</h1>
        <p className="subtitle">
          한-영 통역 연습을 위한 전문 훈련 도구
        </p>
        <p className="description">
          시역과 동시통역 연습을 브라우저에서 바로 시작하세요.
          AI 기반 음성-텍스트 변환으로 정확한 피드백을 받을 수 있습니다.
        </p>
      </header>

      <main className="mode-selection">
        <div className="mode-cards">
          <div className="mode-card">
            <h2>시역 (Sight Translation)</h2>
            <p>
              텍스트를 보며 실시간으로 통역하는 연습입니다.
              롤링 하이라이트 기능으로 자연스러운 속도를 유지할 수 있습니다.
            </p>
            <ul className="features">
              <li>텍스트 입력 또는 샘플 선택</li>
              <li>3단계 속도 조절</li>
              <li>롤링 하이라이트 페이싱</li>
            </ul>
            <button
              className="mode-button sight-button"
              onClick={() => navigate('/sight-translation')}
            >
              시역 모드 시작하기
            </button>
          </div>

          <div className="mode-card">
            <h2>동시통역 (Simultaneous Interpretation)</h2>
            <p>
              영상이나 음성 파일을 들으며 동시통역을 연습합니다.
              다양한 재생 속도로 난이도를 조절할 수 있습니다.
            </p>
            <ul className="features">
              <li>영상/음성 파일 업로드</li>
              <li>재생 속도 조절</li>
              <li>실시간 녹음 및 비교</li>
            </ul>
            <button
              className="mode-button simultaneous-button disabled"
              disabled={true}
            >
              Coming up soon
            </button>
          </div>
        </div>
      </main>

      <footer className="features-section">
        <h3>주요 기능</h3>
        <div className="feature-grid">

          <div className="feature-item">
            <strong>결과 비교</strong>
            <p>원본과 통역 결과를 나란히 비교하여 학습 효과 극대화</p>
          </div>
          <div className="feature-item">
            <strong>브라우저 기반</strong>
            <p>별도 프로그램 설치 없이 웹에서 바로 사용 가능</p>
          </div>
          <div className="feature-item">
            <strong>개인정보 보호</strong>
            <p>모든 처리가 브라우저 내에서 실행되어 개인정보 안전</p>
          </div>
        </div>
      </footer>
      <EnvDebugger />
    </div>
  );
}

export default HomePage;