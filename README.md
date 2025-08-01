# 🎯 한영 통역 연습 도구 (Korean-English Interpreter Training Tool)

React + Vite로 구축된 브라우저 기반 한영 통역 연습 애플리케이션입니다.

## ✨ 주요 기능

- **🔤 시역 (Sight Translation)**: 한국어 텍스트를 보며 실시간 영어 통역 연습
- **🎧 동시통역 (Simultaneous Interpretation)**: 오디오/비디오 파일을 들으며 동시통역 연습
- **🎙️ 음성 녹음**: Web Audio API를 활용한 실시간 녹음
- **📝 AI 전사**: OpenAI Whisper API를 통한 음성-텍스트 변환
- **📊 결과 분석**: 원문과 통역문 비교 및 성과 분석

## 🚀 배포 옵션

### Cloudflare Pages (권장)
```bash
# 1. Cloudflare Dashboard에서 GitHub 연결
# 2. 빌드 설정: npm run build, dist/
# 3. 환경변수 설정: VITE_OPENAI_API_KEY
```

### GitHub Pages
```bash
npm run build
# dist/ 폴더를 gh-pages 브랜치에 배포
```

## 🛠️ 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/practice_tools.git
cd practice_tools
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에서 VITE_OPENAI_API_KEY 설정
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 📦 사용된 주요 기술

- **Frontend**: React 18, Vite, React Router
- **오디오 처리**: Web Audio API, MediaRecorder API
- **AI 전사**: OpenAI Whisper API
- **파일 처리**: JSZip, WASM Media Encoders
- **스타일링**: CSS Modules, 반응형 디자인

## 🌐 브라우저 지원

- Chrome 88+ (권장)
- Firefox 80+
- Safari 14+
- Edge 88+

> **참고**: 마이크 접근을 위해 HTTPS 환경이 필요합니다.

## 📋 개발 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
npm run lint         # ESLint 검사
```

## 🔐 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `VITE_APP_ENV` | 환경 구분 | `development` |

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이센스

MIT License

## 🔧 문제 해결

### 마이크 접근 오류
- HTTPS 환경인지 확인
- 브라우저 마이크 권한 설정 확인
- 다른 앱에서 마이크 사용 중인지 확인

### API 키 관련
- `.env` 파일의 키가 정확한지 확인
- 키가 `sk-`로 시작하는지 확인
- OpenAI 계정의 크레딧 잔액 확인

---

Made with ❤️ for Korean-English interpreters