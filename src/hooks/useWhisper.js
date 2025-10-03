import { useState, useCallback } from 'react';

const useWhisper = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  const transcribe = useCallback(async (audioBlob, fileName = 'recording.mp3') => {
    setIsTranscribing(true);
    setTranscription(null);
    setError(null);

    // Environment-aware API key handling
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;

    // Enhanced API key validation with security checks
    const isValidApiKey = apiKey &&
      apiKey !== 'YOUR_DUMMY_API_KEY_HERE' &&
      apiKey.startsWith('sk-') &&
      apiKey.length > 20;

    // Security warning for production
    if (isProduction && isValidApiKey) {
      console.warn('⚠️ SECURITY WARNING: API key is exposed in client-side code. Consider using a backend proxy for production.');
    }

    if (!isValidApiKey) {
      console.warn('OpenAI API key not configured or invalid');

      const errorMessage = isDevelopment
        ? 'OpenAI API 키가 설정되지 않았습니다. (.env 파일 확인)'
        : 'OpenAI API 키가 설정되지 않았습니다. (관리자에게 문의)';

      setError(errorMessage);
      setIsTranscribing(false);

      // Development: Return dummy data for UI testing
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const dummyText = '더미 전사 텍스트: 안녕하세요, 이것은 API 키 없이 동작하는 더미 데이터입니다.';
        setTranscription(dummyText);
        return dummyText;
      }

      // Production: Show error
      return null;
    }

    // Don't log API usage in production for security
    if (isDevelopment) {
      console.log(`✅ Using OpenAI API in development mode`);
    }

    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('model', 'whisper-1');
    // language 파라미터 제거 - 자동 언어 감지로 녹음된 언어 그대로 전사
    formData.append('response_format', 'json');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Don't expose detailed API errors in production
        const errorMessage = isDevelopment
          ? (data.error?.message || 'Unknown error from Whisper API')
          : 'API 요청 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      setTranscription(data.text);
      setIsTranscribing(false);
      return data.text;
    } catch (err) {
      // Log detailed errors only in development
      if (isDevelopment) {
        console.error('Whisper API error:', err);
      } else {
        console.error('API request failed');
      }

      // Provide user-friendly error messages
      const userMessage = isDevelopment
        ? `Whisper API 요청 중 오류가 발생했습니다: ${err.message}`
        : 'AI 전사 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';

      setError(userMessage);
      setIsTranscribing(false);
      return null;
    }
  }, []);

  return {
    isTranscribing,
    transcription,
    error,
    transcribe,
  };
};

export default useWhisper;
