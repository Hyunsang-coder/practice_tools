import { useState, useCallback } from 'react';

const useWhisper = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  const transcribe = useCallback(async (audioBlob) => {
    setIsTranscribing(true);
    setTranscription(null);
    setError(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_DUMMY_API_KEY_HERE') {
      console.error('OpenAI API key is not set in .env file.');
      setError('OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      setIsTranscribing(false);
      // Simulate a delay and return dummy data for UI development
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTranscription('OpenAI API 키가 설정되지 않아 더미 텍스트를 반환합니다.');
      return 'OpenAI API 키가 설정되지 않아 더미 텍스트를 반환합니다.';
    }

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
