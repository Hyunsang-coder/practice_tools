import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useRecorder from '../hooks/useRecorder';
// useWhisper는 ResultsPage에서만 사용
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './PracticePage.module.css';

// Rolling highlight component for sight translation
const RollingText = ({ text, speed, isPlaying, onComplete, onProgress }) => {
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
  }, [isPlaying, words, speed]);

  // 진행률 및 완료 상태 처리를 별도 useEffect로 분리
  useEffect(() => {
    if (currentIndex >= words.length && words.length > 0) {
      if (onComplete) {
        onComplete();
      }
    } else if (onProgress && words.length > 0) {
      onProgress(Math.round((currentIndex / words.length) * 100));
    }
  }, [currentIndex, words.length, onComplete, onProgress]);

  const getHighlightedText = () => {
    // 현재 단어 주변의 일정 범위만 표시 (윈도우 방식)
    const windowSize = 12; // 한 번에 보여줄 단어 수
    const startIndex = Math.max(0, currentIndex - Math.floor(windowSize / 3));
    const endIndex = Math.min(words.length, startIndex + windowSize);

    const visibleWords = words.slice(startIndex, endIndex);

    return (
      <span className={styles.textWrapper} >
        {visibleWords.map((word, localIndex) => {
          const globalIndex = startIndex + localIndex;
          let className = `${styles.word} word-${globalIndex}`;

          // 현재 단어와 주변 단어들 하이라이트
          if (globalIndex >= currentIndex - 1 && globalIndex <= currentIndex + 2) {
            className += ` ${styles.highlighted}`;
          }
          if (globalIndex === currentIndex) {
            className += ` ${styles.current}`;
          }
          if (globalIndex < currentIndex) {
            className += ` ${styles.passed}`;
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
    <div className={styles.rollingText}>
      <div className={styles.textContent} ref={textContentRef}>
        {getHighlightedText()}
        {onProgress && (
          <div className={styles.progressIndicator}>
            {Math.round((currentIndex / words.length) * 100)}%
          </div>
        )}
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
  const [progress, setProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [enableRecording, setEnableRecording] = useState(true); // 녹음 활성화 상태

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const {
    isRecording,
    audioData,
    recordingTime,
    error: recordingError,
    startRecording,
    stopRecording,
    // resetRecording, // 사용하지 않음
    getAudioUrl
  } = useRecorder();

  // useWhisper 훅은 ResultsPage에서만 사용

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
    setProgress(0);
    // 재시작을 위해 키를 변경하여 RollingText 컴포넌트를 리셋
    setRestartKey(prev => prev + 1);
  }, []);

  // 연습 시작 함수 (녹음 체크박스 상태에 따라 처리)
  const handleStartPractice = useCallback(async () => {
    try {
      if (enableRecording && !isRecording) {
        await startRecording();
      }
      
      // 연습 시작
      if (practiceData?.mode === 'sight-translation') {
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error starting practice:', error);
      alert('연습 시작 중 오류가 발생했습니다.');
    }
  }, [enableRecording, isRecording, startRecording, practiceData?.mode]);

  // 연습 중지 함수
  const handleStopPractice = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setIsPlaying(false);
  }, [isRecording, stopRecording]);

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
      // 시역 연습의 경우 handleStartPractice/handleStopPractice 사용
      if (isPlaying) {
        handleStopPractice();
      } else {
        handleStartPractice();
      }
    }
  }, [isPlaying, practiceData?.mode, isCompleted, handleRestart, handleStartPractice, handleStopPractice]);

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

  // finishPractice를 먼저 정의 (호이스팅 문제 해결)
  const finishPractice = useCallback(async () => {
    console.log('finishPractice - audioData 상태:', {
      hasAudioData: !!audioData,
      audioSize: audioData?.size,
      audioType: audioData?.type
    });

    const resultsData = {
      mode: practiceData?.mode,
      originalText: practiceData?.text || practiceData?.originalScript || '',
      userTranscript: '', // 빈 문자열로 시작, ResultsPage에서 transcribe
      audioUrl: audioData ? getAudioUrl() : null,
      audioData: audioData, // 원본 audioData 전달
      practiceSettings: {
        speed: practiceData?.speed || practiceData?.playbackSpeed,
        duration: recordingTime
      }
    };

    console.log('finishPractice - resultsData:', {
      hasAudioUrl: !!resultsData.audioUrl,
      hasAudioData: !!resultsData.audioData,
      mode: resultsData.mode
    });

    navigate('/results', { state: resultsData });
  }, [audioData, practiceData, getAudioUrl, recordingTime, navigate]);

  const handleFinishPractice = useCallback(async () => {
    // 진행률이 100%가 아닐 때만 확인 팝업 표시
    if (progress < 100) {
      setShowConfirmDialog(true);
      return;
    }

    await finishPractice();
  }, [progress, finishPractice]);

  const handleConfirmFinish = useCallback(() => {
    setShowConfirmDialog(false);
    finishPractice();
  }, [finishPractice]);

  if (!practiceData) {
    return (
      <div className={`${styles.practicePage} ${styles.error}`}>
        <h1>오류</h1>
        <p>연습 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  const isVideo = practiceData?.mode === 'simultaneous' &&
    practiceData?.file?.type.startsWith('video/');

  return (
    <div className={styles.practicePage}>
      <header className={styles.practiceHeader}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          ← 뒤로 가기
        </button>
        <h1>
          {practiceData.mode === 'sight-translation' ? '시역 연습' : '동시통역 연습'}
        </h1>
        <div className={styles.practiceStatus}>
          {isRecording && (
            <span className={styles.recordingIndicator}>
              🔴 녹음 중 ({recordingTime})
            </span>
          )}
        </div>
      </header>

      <main className={styles.practiceContent}>
        <div className={styles.contentArea}>
          {practiceData.mode === 'sight-translation' ? (
            <RollingText
              key={restartKey}
              text={practiceData.text}
              speed={100 * currentSpeed}
              isPlaying={isPlaying}
              onComplete={handleSightTranslationComplete}
              onProgress={setProgress}
            />
          ) : (
            <div className={styles.mediaPlayer}>
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
                <div className={styles.audioPlayerContainer}>
                  <audio
                    ref={audioRef}
                    src={mediaUrl}
                    controls
                    onLoadedMetadata={handleMediaLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsCompleted(true)}
                  />
                  <div className={styles.audioVisual}>
                    <div className={styles.audioIcon}>🎵</div>
                    <p>오디오 재생 중</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.controlsArea}>
          {practiceData.mode === 'sight-translation' && (
            <div className={styles.speedControl}>
              <label className={styles.speedLabel}>
                페이싱 속도: {currentSpeed}배 ({Math.round(100 * currentSpeed)} WPM)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={currentSpeed}
                onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
                className={styles.speedSlider}
              />
              <div className={styles.speedMarkers}>
                <span>0.5배</span>
                <span>1.0배</span>
                <span>1.5배</span>
              </div>
            </div>
          )}

          <div className={styles.recordingControl}>
            <label className={styles.recordingCheckbox}>
              <input
                type="checkbox"
                checked={enableRecording}
                onChange={(e) => setEnableRecording(e.target.checked)}
                disabled={isPlaying}
              />
              <span className={styles.checkboxLabel}>
                🎙️ 녹음하면서 연습하기
              </span>
            </label>
          </div>

          <div className={styles.controlButtons}>
            {practiceData.mode === 'sight-translation' && (
              <button
                className={styles.playPauseButton}
                onClick={handlePlayPause}
              >
                {isCompleted ? '🔄 다시 연습' : isPlaying ? '⏸️ 일시정지' : '🏁 연습 시작'}
              </button>
            )}


            <button
              className={styles.finishButton}
              onClick={handleFinishPractice}
              disabled={isPlaying}
            >
              연습 완료
            </button>
          </div>

          {recordingError && (
            <div className={styles.errorMessage}>
              {recordingError}
            </div>
          )}

          {audioData && (
            <div className={styles.recordingInfo}>
              <p>✅ 녹음 완료 ({recordingTime})</p>
            </div>
          )}
        </div>
      </main>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message="아직 연습이 완료되지 않았습니다. 정말로 연습을 완료하시겠습니까?"
        onConfirm={handleConfirmFinish}
        onCancel={() => setShowConfirmDialog(false)}
        confirmText="완료"
        cancelText="취소"
      />
    </div>
  );
}

export default PracticePage;
