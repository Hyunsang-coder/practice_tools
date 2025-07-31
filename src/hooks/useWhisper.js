import { useState, useCallback, useRef } from 'react';

const useWhisper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');

  const modelRef = useRef(null);

  // Simulate model loading (placeholder for actual Whisper.wasm integration)
  const loadModel = useCallback(async () => {
    if (isModelLoaded) return;

    try {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);

      // Simulate progressive loading
      const steps = [
        { progress: 20, message: 'Downloading Whisper model...' },
        { progress: 50, message: 'Loading WebAssembly modules...' },
        { progress: 80, message: 'Initializing model...' },
        { progress: 100, message: 'Model ready!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingProgress(step.progress);
      }

      // Mock model reference
      modelRef.current = { loaded: true };
      setIsModelLoaded(true);
      
    } catch (err) {
      console.error('Error loading Whisper model:', err);
      setError('모델 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isModelLoaded]);

  // Convert audio to text using Web Speech API as fallback
  const transcribeAudio = useCallback(async (audioBlob, language = 'ko-KR') => {
    if (!audioBlob) {
      setError('오디오 데이터가 없습니다.');
      return '';
    }

    try {
      setIsLoading(true);
      setError(null);
      setTranscript('');

      // For MVP, use Web Speech API as a fallback
      // In production, this would be replaced with Whisper.wasm
      const result = await transcribeWithWebSpeechAPI(audioBlob, language);
      
      setTranscript(result);
      return result;

    } catch (err) {
      console.error('Transcription error:', err);
      setError('음성 변환 중 오류가 발생했습니다.');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Web Speech API implementation (fallback)
  const transcribeWithWebSpeechAPI = useCallback((audioBlob, language) => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        // Simulate transcription for unsupported browsers
        setTimeout(() => {
          const mockTranscript = language === 'ko-KR' 
            ? "안녕하세요, 이것은 모의 음성 인식 결과입니다. 실제 구현에서는 Whisper 모델을 사용하여 더 정확한 결과를 제공합니다."
            : "Hello, this is a mock speech recognition result. In the actual implementation, we would use the Whisper model for more accurate results.";
          resolve(mockTranscript);
        }, 2000);
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Create audio element and play for recognition
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
      recognition.start();

      // Fallback timeout
      setTimeout(() => {
        recognition.stop();
        reject(new Error('Recognition timeout'));
      }, 30000);
    });
  }, []);

  // Future: Whisper.wasm implementation placeholder
  const transcribeWithWhisper = useCallback(async (audioBuffer, language = 'ko') => {
    // This would be the actual Whisper.wasm implementation
    // For now, return mock data
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockTranscripts = {
      ko: "안녕하세요, 오늘은 인공지능 기술의 발전에 대해 말씀드리려고 합니다. 최근 몇 년간 AI 기술은 놀라운 속도로 발전하고 있으며, 우리 일상생활에 많은 변화를 가져오고 있습니다.",
      en: "Hello, today I would like to talk about the advancement of artificial intelligence technology. In recent years, AI technology has been developing at an amazing pace and is bringing many changes to our daily lives."
    };

    return mockTranscripts[language] || mockTranscripts.en;
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isLoading,
    isModelLoaded,
    loadingProgress,
    error,
    transcript,
    loadModel,
    transcribeAudio,
    clearTranscript,
    isSupported: true // Will be determined by Whisper.wasm availability in production
  };
};

export default useWhisper;