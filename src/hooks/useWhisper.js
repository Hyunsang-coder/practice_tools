import { useState, useCallback } from 'react';

const useWhisper = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  const transcribe = useCallback(async (audioBlob) => {
    setIsTranscribing(true);
    setTranscription(null);
    setError(null);

    // Environment-aware API key handling
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;
    
    // API key validation
    const isValidApiKey = apiKey && 
                         apiKey !== 'YOUR_DUMMY_API_KEY_HERE' && 
                         apiKey.startsWith('sk-') && 
                         apiKey.length > 20;
    
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
    
    console.log(`Using OpenAI API in ${isProduction ? 'production' : 'development'} mode`);

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');
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
        throw new Error(data.error?.message || 'Unknown error from Whisper API');
      }

      setTranscription(data.text);
      setIsTranscribing(false);
      return data.text;
    } catch (err) {
      console.error('Whisper API error:', err);
      setError(`Whisper API 요청 중 오류가 발생했습니다: ${err.message}`);
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
