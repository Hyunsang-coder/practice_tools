import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useRecorder from '../hooks/useRecorder';
// useWhisper는 ResultsPage에서만 사용
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './PracticePage.module.css';

// Rolling highlight component for sight translation - Optimized with React.memo
const RollingText = React.memo(({ text, speed, isPlaying, onComplete, onProgress, displaySettings }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState([]);
  const intervalRef = useRef(null);
  const textContentRef = useRef(null);

  // 기본 설정값
  const {
    windowSize = 12,           // 한 번에 보여줄 단어 수
    fontSize = 2.0,            // 폰트 크기 (rem)
    textColor = '#000000',     // 텍스트 색상
    highlightRange = 0         // 강조 범위
  } = displaySettings || {};

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
      // container.scrollTop = 0; // 이 부분을 제거하여 강제 스크롤 방지
      container.style.fontSize = `${fontSize}rem`; // 폰트 크기 실시간 적용
    }
  }, [currentIndex, fontSize]);

  // 현재 단어가 항상 보이도록 스크롤 - Optimized with requestAnimationFrame
  useEffect(() => {
    if (textContentRef.current && words.length > 0) {
      // Use requestAnimationFrame to optimize scroll performance
      requestAnimationFrame(() => {
        const currentWordElement = textContentRef.current?.querySelector(`.word-${currentIndex}`);
        if (currentWordElement) {
          currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [currentIndex, words]);

  useEffect(() => {
    if (isPlaying && words.length > 0) {
      const wordsPerMinute = speed;
      const intervalMs = (60 / wordsPerMinute) * 1000;

      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next > words.length) {
            // 마지막 단어 이후에도 한 번 더 진행해서 100% 달성
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
    if (words.length === 0) return;

    if (currentIndex >= words.length) {
      // 100% 달성 후 완료 처리
      if (onProgress) {
        onProgress(100);
      }
      if (onComplete) {
        onComplete();
      }
    } else {
      // 진행률 계산: 마지막 단어에서 100%가 되도록 조정
      const progress = Math.round(Math.min(100, (currentIndex / Math.max(1, words.length - 1)) * 100));
      if (onProgress) {
        onProgress(progress);
      }
    }
  }, [currentIndex, words.length, onComplete, onProgress]);

  // Memoize highlighted text to prevent unnecessary re-renders
  const highlightedText = useMemo(() => {
    if (words.length === 0) return null;
    
    // 현재 단어를 중앙에 배치하는 윈도우 방식
    const halfWindow = Math.floor(windowSize / 2);
    let startIndex = Math.max(0, currentIndex - halfWindow);
    let endIndex = Math.min(words.length, startIndex + windowSize);

    // 텍스트 끝 부분에서 윈도우 크기 보정
    if (endIndex === words.length && startIndex > 0) {
      startIndex = Math.max(0, words.length - windowSize);
      endIndex = words.length;
    }

    const visibleWords = words.slice(startIndex, endIndex);

    return (
      <span className={styles.textWrapper} style={{ fontSize: `${fontSize}rem`, color: textColor }}>
        {visibleWords.map((word, localIndex) => {
          const globalIndex = startIndex + localIndex;
          let className = `${styles.word} word-${globalIndex}`;

          // 강조 범위 내의 단어들은 기본색(강조), 나머지는 연한색
          const distance = Math.abs(globalIndex - currentIndex);
          if (distance <= highlightRange) {
            className += ` ${styles.highlighted}`;
          } else {
            className += ` ${styles.dimmed}`;
          }

          return (
            <span key={globalIndex} className={className} style={{ color: textColor }}>
              {word}
              {localIndex < visibleWords.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  }, [words, currentIndex, windowSize, fontSize, textColor, highlightRange]);

  // Memoize progress calculation - Fix React Hooks Rule violation
  const progressPercentage = useMemo(() => 
    Math.round((currentIndex / words.length) * 100), 
    [currentIndex, words.length]
  );

  return (
    <div className={styles.rollingText}>
      <div className={styles.textContent} ref={textContentRef}>
        {highlightedText}
        {onProgress && (
          <div className={styles.progressIndicator}>
            {progressPercentage}%
          </div>
        )}
      </div>
    </div>
  );
});

function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const practiceData = location.state;

  // Grouped state for better organization - Playback controls
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    isCompleted: false,
    progress: 0,
    currentSpeed: practiceData?.speed || 1.0,
    restartKey: 0
  });

  // Media and recording state
  const [mediaState, setMediaState] = useState({
    mediaUrl: null,
    enableRecording: false,
    autoStopTimeout: null
  });

  // UI state
  const [uiState, setUiState] = useState({
    showConfirmDialog: false,
    showDisplaySettings: true
  });

  // 텍스트 표시 설정
  const [displaySettings, setDisplaySettings] = useState({
    windowSize: 12,        // 한 번에 보여줄 단어 수
    fontSize: 2.0,         // 폰트 크기 (rem)
    textColor: '#000000',  // 텍스트 색상
    highlightRange: 2      // 강조 범위 (0=현재만, 1=현재±1, 2=현재±2)
  });

  // Convenience getters for backward compatibility
  const isPlaying = playbackState.isPlaying;
  const isCompleted = playbackState.isCompleted;
  const progress = playbackState.progress;
  const currentSpeed = playbackState.currentSpeed;
  const restartKey = playbackState.restartKey;
  const mediaUrl = mediaState.mediaUrl;
  const enableRecording = mediaState.enableRecording;
  const autoStopTimeout = mediaState.autoStopTimeout;
  const showConfirmDialog = uiState.showConfirmDialog;
  const showDisplaySettings = uiState.showDisplaySettings;

  // Convenience setters for backward compatibility
  const setIsPlaying = useCallback((value) => {
    setPlaybackState(prev => ({ ...prev, isPlaying: value }));
  }, []);
  
  const setIsCompleted = useCallback((value) => {
    setPlaybackState(prev => ({ ...prev, isCompleted: value }));
  }, []);
  
  const setProgress = useCallback((value) => {
    setPlaybackState(prev => ({ ...prev, progress: value }));
  }, []);
  
  const setCurrentSpeed = useCallback((value) => {
    setPlaybackState(prev => ({ ...prev, currentSpeed: value }));
  }, []);
  
  const setRestartKey = useCallback((value) => {
    setPlaybackState(prev => ({ ...prev, restartKey: value }));
  }, []);
  
  const setMediaUrl = useCallback((value) => {
    setMediaState(prev => ({ ...prev, mediaUrl: value }));
  }, []);
  
  const setEnableRecording = useCallback((value) => {
    setMediaState(prev => ({ ...prev, enableRecording: value }));
  }, []);
  
  const setAutoStopTimeout = useCallback((value) => {
    setMediaState(prev => ({ ...prev, autoStopTimeout: value }));
  }, []);
  
  const setShowConfirmDialog = useCallback((value) => {
    setUiState(prev => ({ ...prev, showConfirmDialog: value }));
  }, []);
  
  const setShowDisplaySettings = useCallback((value) => {
    setUiState(prev => ({ ...prev, showDisplaySettings: value }));
  }, []);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const {
    isRecording,
    isPaused,
    audioData,
    recordingTime,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
    // resetRecording, getAudioUrl // 사용하지 않음
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

  // Cleanup auto-stop timeout on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
      }
    };
  }, [autoStopTimeout]);

  const handleRestart = useCallback(() => {
    // 자동 중지 타이머가 있다면 취소
    if (autoStopTimeout) {
      clearTimeout(autoStopTimeout);
      setAutoStopTimeout(null);
    }

    setIsCompleted(false);
    setIsPlaying(false);
    setProgress(0);
    // 재시작을 위해 키를 변경하여 RollingText 컴포넌트를 리셋
    setRestartKey(prev => prev + 1);
  }, [autoStopTimeout]);

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

  // 연습 일시정지 함수
  const handlePausePractice = useCallback(() => {
    setIsPlaying(false);

    if (isRecording && !isPaused) {
      pauseRecording();
    }
  }, [isRecording, isPaused, pauseRecording]);

  // 연습 재개 함수
  const handleResumePractice = useCallback(() => {
    if (practiceData?.mode === 'sight-translation') {
      setIsPlaying(true);

      if (isRecording && isPaused) {
        resumeRecording();
      }
    }
  }, [practiceData?.mode, isRecording, isPaused, resumeRecording]);

  // 연습 완전 중지 함수 (for future use)
  // eslint-disable-next-line no-unused-vars
  const handleStopPractice = useCallback(async () => {
    // 자동 중지 타이머가 있다면 취소
    if (autoStopTimeout) {
      clearTimeout(autoStopTimeout);
      setAutoStopTimeout(null);
    }

    if (isRecording) {
      await stopRecording();
    }
    setIsPlaying(false);
  }, [isRecording, stopRecording, autoStopTimeout]);

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
      // 문장 구역 연습의 경우: 첫 시작, 재개, 일시정지 처리
      if (isPlaying) {
        // 연습 중이면 일시정지
        handlePausePractice();
      } else if (isPaused && isRecording) {
        // 일시정지 상태이면 재개
        handleResumePractice();
      } else {
        // 처음 시작
        handleStartPractice();
      }
    }
  }, [isPlaying, isPaused, isRecording, practiceData?.mode, isCompleted, handleRestart, handleStartPractice, handlePausePractice, handleResumePractice]);

  const handleMediaLoadedMetadata = useCallback(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && practiceData?.playbackSpeed) {
      mediaElement.playbackRate = practiceData.playbackSpeed;
    }
  }, [practiceData?.playbackSpeed]);

  const handleSightTranslationComplete = useCallback(() => {
    setIsPlaying(false);
    setIsCompleted(true);

    // 진행률 100% 달성 시 4초 후 자동으로 녹음 중지
    if (isRecording && !isPaused) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-stopping recording after 4 seconds grace period');
        stopRecording();
      }, 4000);
      setAutoStopTimeout(timeoutId);
    }
  }, [isRecording, isPaused, stopRecording]);

  // finishPractice를 먼저 정의 (호이스팅 문제 해결)
  const finishPractice = useCallback(async () => {
    try {
      let currentAudioData = audioData;

      // 녹음 중이면 중지하고 완료될 때까지 대기
      if (isRecording) {
        try {
          const stoppedAudioData = await stopRecording();
          currentAudioData = stoppedAudioData || audioData;
        } catch (recordingError) {
          console.error('Recording stop failed:', recordingError);
          // 녹음 중지에 실패해도 계속 진행
          currentAudioData = audioData;
        }
      }

      // 자동 중지 타이머가 있다면 취소
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
        setAutoStopTimeout(null);
      }

      setIsPlaying(false);

      // 결과 데이터 생성 시 안전한 처리
      let audioUrl = null;
      if (currentAudioData) {
        try {
          audioUrl = URL.createObjectURL(currentAudioData);
        } catch (urlError) {
          console.error('Failed to create audio URL:', urlError);
          // URL 생성에 실패해도 오디오 데이터는 전달
        }
      }

      const resultsData = {
        mode: practiceData?.mode || 'unknown',
        originalText: practiceData?.text || practiceData?.originalScript || '',
        userTranscript: '', // 빈 문자열로 시작, ResultsPage에서 transcribe
        audioUrl,
        audioData: currentAudioData, // 원본 audioData 전달
        practiceSettings: {
          speed: practiceData?.speed || practiceData?.playbackSpeed || 1.0,
          duration: recordingTime || '00:00'
        },
        // 다시 연습하기를 위한 원본 practiceData 보존
        originalPracticeData: practiceData
      };

      navigate('/results', { state: resultsData });
    } catch (error) {
      console.error('Critical error in finishPractice:', error);
      
      // 사용자에게 에러 알림
      alert('연습 완료 중 오류가 발생했습니다. 다시 시도해주세요.');
      
      // 에러가 발생해도 최소한의 데이터로 결과 페이지로 이동
      try {
        const fallbackData = {
          mode: practiceData?.mode || 'unknown',
          originalText: practiceData?.text || practiceData?.originalScript || '',
          userTranscript: '',
          audioUrl: null,
          audioData: null,
          practiceSettings: {
            speed: 1.0,
            duration: '00:00'
          },
          originalPracticeData: practiceData,
          hasError: true
        };
        
        navigate('/results', { state: fallbackData });
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        // 최후의 수단으로 홈으로 리다이렉트
        navigate('/');
      }
    }
  }, [audioData, practiceData, recordingTime, navigate, isRecording, stopRecording, autoStopTimeout]);

  const handleFinishPractice = useCallback(async () => {
    try {
      // 진행률이 100%가 아닐 때만 확인 팝업 표시
      if (progress < 100) {
        setShowConfirmDialog(true);
        return;
      }

      await finishPractice();
    } catch (error) {
      console.error('Error in handleFinishPractice:', error);
      alert('연습 완료 처리 중 오류가 발생했습니다.');
    }
  }, [progress, finishPractice]);

  const handleConfirmFinish = useCallback(async () => {
    try {
      setShowConfirmDialog(false);
      await finishPractice();
    } catch (error) {
      console.error('Error in handleConfirmFinish:', error);
      alert('연습 완료 처리 중 오류가 발생했습니다.');
    }
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
          onClick={() => {
            if (practiceData.mode === 'sight-translation') {
              navigate('/sight-translation');
            } else {
              navigate('/simultaneous');
            }
          }}
        >
          ← 뒤로 가기
        </button>
        <h1>
          {practiceData.mode === 'sight-translation' ? '문장 구역 연습' : '동시통역 연습'}
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
              displaySettings={displaySettings}
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
            <div className={styles.displaySettings}>
              <h3
                className={styles.settingsTitle}
                onClick={() => setShowDisplaySettings(!showDisplaySettings)}
                style={{ cursor: 'pointer' }}
              >
                텍스트 표시 설정 <span className={styles.toggleIcon}>{showDisplaySettings ? '▲' : '▼'}</span>
              </h3>
              {showDisplaySettings && (
                <div className={styles.settingsContent}>
                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>
                      롤링 속도: <span className={styles.settingValue}>{currentSpeed}배 ({Math.round(100 * currentSpeed)} WPM)</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={currentSpeed}
                      onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
                      className={styles.settingSlider}
                    />
                    <div className={styles.settingMarkers}>
                      <span>0.5</span>
                      <span>1.0</span>
                      <span>1.5</span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>
                      한 줄에 보이는 단어 수: <span className={styles.settingValue}>{displaySettings.windowSize}개</span>
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="18"
                      step="1"
                      value={displaySettings.windowSize}
                      onChange={(e) => setDisplaySettings(prev => ({
                        ...prev,
                        windowSize: parseInt(e.target.value)
                      }))}
                      className={styles.settingSlider}
                    />
                    <div className={styles.settingMarkers}>
                      <span>6</span>
                      <span>12</span>
                      <span>18</span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>
                      폰트 크기: <span className={styles.settingValue}>{displaySettings.fontSize}rem</span>
                    </label>
                    <input
                      type="range"
                      min="1.5"
                      max="2.5"
                      step="0.1"
                      value={displaySettings.fontSize}
                      onChange={(e) => setDisplaySettings(prev => ({
                        ...prev,
                        fontSize: parseFloat(e.target.value)
                      }))}
                      className={styles.settingSlider}
                    />
                    <div className={styles.settingMarkers}>
                      <span>1.5</span>
                      <span>2.0</span>
                      <span>2.5</span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>
                      텍스트 색상
                    </label>
                    <div className={styles.colorOptions}>
                      {['#000000', '#333333', '#0066CC', '#CC6600', '#CC0000'].map(color => (
                        <button
                          key={color}
                          className={`${styles.colorButton} ${displaySettings.textColor === color ? styles.colorButtonActive : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setDisplaySettings(prev => ({
                            ...prev,
                            textColor: color
                          }))}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={displaySettings.textColor}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          textColor: e.target.value
                        }))}
                        className={styles.colorPicker}
                        title="사용자 정의 색상"
                      />
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>
                      강조 범위: <span className={styles.settingValue}>
                        {displaySettings.highlightRange === 0 ? '현재만' :
                          displaySettings.highlightRange === 1 ? '현재±1개' :
                            displaySettings.highlightRange === 2 ? '현재±2개' :
                              displaySettings.highlightRange === 3 ? '현재±3개' : `현재±${displaySettings.highlightRange}개`}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={displaySettings.highlightRange}
                      onChange={(e) => setDisplaySettings(prev => ({
                        ...prev,
                        highlightRange: parseInt(e.target.value)
                      }))}
                      className={styles.settingSlider}
                    />
                    <div className={styles.settingMarkers}>
                      <span>0</span>
                      <span>2</span>
                      <span>4</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.controlButtons}>
            <label className={styles.recordingCheckbox}>
              <input
                type="checkbox"
                checked={enableRecording}
                onChange={(e) => setEnableRecording(e.target.checked)}
                disabled={isPlaying || isRecording}
              />
              <span className={styles.checkboxLabel}>
                🎙️ 녹음
              </span>
            </label>

            {practiceData.mode === 'sight-translation' && (
              <button
                className={styles.playPauseButton}
                onClick={handlePlayPause}
              >
                {isCompleted ? '🔄 다시 연습' :
                  isPlaying ? '⏸️ 일시정지' :
                    (isPaused && isRecording) ? '▶️ 연습 재개' :
                      (isCompleted && autoStopTimeout) ? '⏸️ 일시정지' :
                        '🏁 연습 시작'}
              </button>
            )}

            <button
              className={styles.finishButton}
              onClick={handleFinishPractice}
              disabled={isPlaying || (isRecording && !isPaused && !isCompleted && !autoStopTimeout)}
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
