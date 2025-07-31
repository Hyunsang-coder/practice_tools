import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useRecorder from '../hooks/useRecorder';
import useWhisper from '../hooks/useWhisper';
import './PracticePage.css';

// Rolling highlight component for sight translation
const RollingText = ({ text, speed, isPlaying, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState([]);
  const intervalRef = useRef(null);
  const textContentRef = useRef(null);

  useEffect(() => {
    if (text) {
      const wordArray = text.split(/\s+/).filter(word => word.length > 0);
      setWords(wordArray);
      setCurrentIndex(0);
    }
  }, [text]);

  // 텍스트 컨테이너를 상단에 고정하고 스크롤 방지
  useEffect(() => {
    if (textContentRef.current) {
      const container = textContentRef.current;
      // 스크롤을 항상 최상단으로 고정
      container.scrollTop = 0;
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isPlaying && words.length > 0) {
      const wordsPerMinute = speed;
      const intervalMs = (60 / wordsPerMinute) * 1000;

      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= words.length) {
            onComplete();
            return prev;
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, words, speed, onComplete]);

  const getHighlightedText = () => {
    // 현재 단어 주변의 일정 범위만 표시 (윈도우 방식)
    const windowSize = 12; // 한 번에 보여줄 단어 수
    const startIndex = Math.max(0, currentIndex - Math.floor(windowSize / 3));
    const endIndex = Math.min(words.length, startIndex + windowSize);
    
    const visibleWords = words.slice(startIndex, endIndex);
    
    return (
      <span style={{ whiteSpace: 'nowrap', display: 'block', lineHeight: '3.5rem' }}>
        {visibleWords.map((word, localIndex) => {
          const globalIndex = startIndex + localIndex;
          let className = `word word-${globalIndex}`;

          // 현재 단어와 주변 단어들 하이라이트
          if (globalIndex >= currentIndex - 1 && globalIndex <= currentIndex + 2) {
            className += ' highlighted';
          }
          if (globalIndex === currentIndex) {
            className += ' current';
          }
          if (globalIndex < currentIndex) {
            className += ' passed';
          }

          return (
            <span key={globalIndex} className={className}>
              {word}
              {localIndex < visibleWords.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="rolling-text">
      <div className="text-content" ref={textContentRef}>
        {getHighlightedText()}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(currentIndex / words.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const practiceData = location.state;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(practiceData?.speed || 1.0);
  const [restartKey, setRestartKey] = useState(0);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const {
    isRecording,
    audioData,
    recordingTime,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
    getAudioUrl
  } = useRecorder();

  const {
    isLoading: isTranscribing,
    transcript,
    transcribeAudio,
    clearTranscript
  } = useWhisper();

  // Initialize media for simultaneous interpretation
  useEffect(() => {
    if (practiceData?.mode === 'simultaneous' && practiceData?.file) {
      const url = URL.createObjectURL(practiceData.file);
      setMediaUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [practiceData]);

  // Auto-start for sight translation - 비활성화
  // useEffect(() => {
  //   if (practiceData?.mode === 'sight-translation') {
  //     // Auto-start after a brief delay
  //     setTimeout(() => {
  //       setIsPlaying(true);
  //     }, 1000);
  //   }
  // }, [practiceData]);

  const handleRestart = useCallback(() => {
    setIsCompleted(false);
    setIsPlaying(false);
    // 재시작을 위해 키를 변경하여 RollingText 컴포넌트를 리셋
    setRestartKey(prev => prev + 1);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isCompleted) {
      // 완료된 상태에서는 재시작
      handleRestart();
      return;
    }

    if (practiceData?.mode === 'simultaneous') {
      const mediaElement = videoRef.current || audioRef.current;
      if (mediaElement) {
        if (isPlaying) {
          mediaElement.pause();
        } else {
          mediaElement.play();
        }
        setIsPlaying(!isPlaying);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, practiceData?.mode, isCompleted, handleRestart]);

  const handleMediaLoadedMetadata = useCallback(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && practiceData?.playbackSpeed) {
      mediaElement.playbackRate = practiceData.playbackSpeed;
    }
  }, [practiceData?.playbackSpeed]);

  const handleSightTranslationComplete = useCallback(() => {
    setIsPlaying(false);
    setIsCompleted(true);
  }, []);

  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleFinishPractice = useCallback(async () => {
    // 재생 중일 때 확인 팝업 표시
    if (isPlaying) {
      const confirmed = window.confirm('현재 재생 중입니다. 정말로 연습을 완료하시겠습니까?');
      if (!confirmed) {
        return;
      }
    }

    let userTranscript = '';

    if (audioData) {
      userTranscript = await transcribeAudio(audioData, 'ko-KR');
    }

    const resultsData = {
      mode: practiceData?.mode,
      originalText: practiceData?.text || practiceData?.originalScript || '',
      userTranscript,
      audioUrl: audioData ? getAudioUrl() : null,
      practiceSettings: {
        speed: practiceData?.speed || practiceData?.playbackSpeed,
        duration: recordingTime
      }
    };

    navigate('/results', { state: resultsData });
  }, [audioData, transcribeAudio, practiceData, getAudioUrl, recordingTime, navigate, isPlaying]);

  if (!practiceData) {
    return (
      <div className="practice-page error">
        <h1>오류</h1>
        <p>연습 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  const isVideo = practiceData?.mode === 'simultaneous' &&
    practiceData?.file?.type.startsWith('video/');

  return (
    <div className="practice-page">
      <header className="practice-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 뒤로 가기
        </button>
        <h1>
          {practiceData.mode === 'sight-translation' ? '시역 연습' : '동시통역 연습'}
        </h1>
        <div className="practice-status">
          {isRecording && (
            <span className="recording-indicator">
              🔴 녹음 중 ({recordingTime})
            </span>
          )}
        </div>
      </header>

      <main className="practice-content">
        <div className="content-area">
          {practiceData.mode === 'sight-translation' ? (
            <RollingText
              key={restartKey}
              text={practiceData.text}
              speed={100 * currentSpeed}
              isPlaying={isPlaying}
              onComplete={handleSightTranslationComplete}
            />
          ) : (
            <div className="media-player">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  onLoadedMetadata={handleMediaLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsCompleted(true)}
                />
              ) : (
                <div className="audio-player-container">
                  <audio
                    ref={audioRef}
                    src={mediaUrl}
                    controls
                    onLoadedMetadata={handleMediaLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsCompleted(true)}
                  />
                  <div className="audio-visual">
                    <div className="audio-icon">🎵</div>
                    <p>오디오 재생 중</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="controls-area">
          {practiceData.mode === 'sight-translation' && (
            <div className="speed-control">
              <label className="speed-label">
                페이싱 속도: {currentSpeed}배 ({Math.round(100 * currentSpeed)} WPM)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={currentSpeed}
                onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
                className="speed-slider"
              />
              <div className="speed-markers">
                <span>0.5배</span>
                <span>1.0배</span>
                <span>1.5배</span>
              </div>
            </div>
          )}

          <div className="control-buttons">
            {practiceData.mode === 'sight-translation' && (
              <button
                className="play-pause-button"
                onClick={handlePlayPause}
              >
                {isCompleted ? '🔄 다시 재생' : isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
              </button>
            )}

            <button
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={handleRecordingToggle}
              disabled={isTranscribing}
            >
              {isRecording ? '⏹️ 녹음 중지' : '🎙️ 녹음 시작'}
            </button>

            <button
              className="finish-button"
              onClick={handleFinishPractice}
              disabled={isTranscribing}
            >
              {isTranscribing ? '처리 중...' : '연습 완료'}
            </button>
          </div>

          {recordingError && (
            <div className="error-message">
              {recordingError}
            </div>
          )}

          {audioData && (
            <div className="recording-info">
              <p>✅ 녹음 완료 ({recordingTime})</p>
              <audio src={getAudioUrl()} controls />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PracticePage;