import { useState, useRef, useCallback, useEffect } from 'react';

// Browser compatibility check utility
const checkBrowserSupport = () => {
  const issues = [];
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push('Microphone access not supported');
  }
  
  if (!window.MediaRecorder) {
    issues.push('Audio recording not supported');
  }
  
  // Check for specific MIME type support
  const supportedTypes = [];
  const typesToTest = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  
  if (window.MediaRecorder) {
    typesToTest.forEach(type => {
      if (MediaRecorder.isTypeSupported(type)) {
        supportedTypes.push(type);
      }
    });
  }
  
  if (supportedTypes.length === 0 && window.MediaRecorder) {
    issues.push('No supported audio formats found');
  }
  
  return {
    isSupported: issues.length === 0,
    issues,
    supportedTypes
  };
};

const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [browserSupport] = useState(() => checkBrowserSupport());

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Check browser support before attempting to record
      if (!browserSupport.isSupported) {
        const errorMessage = `Recording not supported: ${browserSupport.issues.join(', ')}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Request microphone access with fallback constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for Whisper
        }
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to basic audio constraints if advanced features fail
        console.warn('Advanced audio constraints failed, trying basic:', err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Select best supported MIME type
      let mimeType = 'audio/webm'; // Default
      if (browserSupport.supportedTypes.length > 0) {
        // Prefer webm, then mp4, then others
        const preferredOrder = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
        mimeType = preferredOrder.find(type => browserSupport.supportedTypes.includes(type)) 
                  || browserSupport.supportedTypes[0];
      }
      
      // Create MediaRecorder with error handling
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000
        });
      } catch (err) {
        // Fallback without bitrate specification
        console.warn('MediaRecorder with bitrate failed, trying without:', err);
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      }

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioData(audioBlob);

          // Cleanup
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        } catch (error) {
          console.error('MediaRecorder onstop error:', error);
          setError('녹음 완료 중 오류가 발생했습니다.');
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = '마이크 접근 권한이 필요합니다.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '마이크 접근이 차단되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '현재 브라우저는 오디오 녹음을 지원하지 않습니다.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '마이크를 사용할 수 없습니다. 다른 앱에서 사용 중일 수 있습니다.';
      }
      
      setError(errorMessage);
    }
  }, [browserSupport]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        // Create audio blob immediately to avoid race conditions
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType || 'audio/webm' 
        });

        // Set up onstop handler to ensure proper cleanup sequence
        mediaRecorderRef.current.onstop = () => {
          // Use requestAnimationFrame to ensure DOM updates complete
          requestAnimationFrame(() => {
            // Clean up media stream
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }

            // Update states
            setIsRecording(false);
            setIsPaused(false);

            // Clear timer
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            // Set audio data and resolve with same blob to ensure consistency
            setAudioData(audioBlob);
            
            // Use setTimeout to ensure React state updates complete before resolving
            setTimeout(() => {
              resolve(audioBlob);
            }, 0);
          });
        };

        // Handle error case
        mediaRecorderRef.current.onerror = (error) => {
          console.error('MediaRecorder stop error:', error);
          resolve(audioBlob); // Still resolve with the blob we have
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, [isRecording]);

  const audioUrlRef = useRef(null);

  const resetRecording = useCallback(() => {
    // Clean up URL object before resetting
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch (error) {
        console.warn('URL revocation failed:', error);
      }
      audioUrlRef.current = null;
    }
    
    setAudioData(null);
    setRecordingTime(0);
    setError(null);
    setIsPaused(false);
    audioChunksRef.current = [];
  }, []);

  const getAudioUrl = useCallback(() => {
    if (audioData) {
      try {
        // Clean up previous URL object to prevent memory leaks
        if (audioUrlRef.current) {
          try {
            URL.revokeObjectURL(audioUrlRef.current);
          } catch (revokeError) {
            console.warn('URL revocation failed:', revokeError);
          }
          audioUrlRef.current = null;
        }
        
        // Validate blob before creating URL
        if (audioData instanceof Blob && audioData.size > 0) {
          audioUrlRef.current = URL.createObjectURL(audioData);
          return audioUrlRef.current;
        } else {
          console.warn('Invalid audio blob detected:', { audioData, size: audioData?.size });
          return null;
        }
      } catch (error) {
        console.error('Audio URL creation failed:', error);
        return null;
      }
    }
    return null;
  }, [audioData]);

  // Cleanup URL object when component unmounts or audioData changes
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch (error) {
          console.warn('URL revocation failed in cleanup:', error);
        }
        audioUrlRef.current = null;
      }
    };
  }, [audioData]);

  // Cleanup media resources on component unmount
  useEffect(() => {
    return () => {
      // Stop recording if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn('Failed to stop MediaRecorder during cleanup:', error);
        }
      }
      
      // Clean up media stream
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Failed to stop media tracks during cleanup:', error);
        }
        streamRef.current = null;
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clean up URL object
      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch (error) {
          console.warn('URL revocation failed in final cleanup:', error);
        }
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Convert blob to ArrayBuffer for Whisper processing
  const getAudioBuffer = useCallback(async () => {
    if (audioData) {
      return await audioData.arrayBuffer();
    }
    return null;
  }, [audioData]);

  // Format recording time as MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    isPaused,
    audioData,
    recordingTime: formatTime(recordingTime),
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    getAudioUrl,
    getAudioBuffer,
    isSupported: browserSupport.isSupported,
    browserSupport,
    supportedMimeTypes: browserSupport.supportedTypes
  };
};

export default useRecorder;