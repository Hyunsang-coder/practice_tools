import { useState, useCallback } from 'react';

const useMp3Converter = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(null);

  // Check browser support on first use
  const checkSupport = useCallback(() => {
    if (isSupported !== null) return isSupported;
    
    const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    const hasArrayBuffer = typeof ArrayBuffer !== 'undefined';
    
    const supported = hasWebAudio && hasWebAssembly && hasArrayBuffer;
    setIsSupported(supported);
    return supported;
  }, [isSupported]);

  const convertToMp3 = useCallback(async (audioBlob) => {
    setIsConverting(true);
    setConversionProgress(0);
    setError(null);

    // Check browser support first
    if (!checkSupport()) {
      setError('현재 브라우저는 MP3 변환을 지원하지 않습니다. 원본 오디오 파일을 사용합니다.');
      setIsConverting(false);
      return audioBlob; // Return original blob as fallback
    }

    try {
      // Dynamic import to reduce bundle size with timeout
      const importPromise = import('wasm-media-encoders');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Import timeout')), 10000)
      );
      
      const { createMp3Encoder } = await Promise.race([importPromise, timeoutPromise]);
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Check Web Audio API support with enhanced detection
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      
      // Decode audio data using Web Audio API with error handling
      const audioContext = new AudioContextClass();
      let audioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } catch (decodeError) {
        // Try alternative decoding method for older browsers
        console.warn('Primary decode method failed, trying fallback:', decodeError);
        audioBuffer = await new Promise((resolve, reject) => {
          audioContext.decodeAudioData(
            arrayBuffer,
            resolve,
            reject
          );
        });
      }
      
      // Create MP3 encoder
      const encoder = await createMp3Encoder();
      encoder.configure({
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        vbrQuality: 2, // Good quality (0-9, lower = better quality)
      });

      setConversionProgress(50); // Set progress to 50% after setup

      // Extract all channel data at once
      const pcmChannels = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        pcmChannels.push(audioBuffer.getChannelData(i));
      }

      // Encode the entire audio at once
      const encodedData = encoder.encode(pcmChannels);
      const finalData = encoder.finalize();

      // Combine encoded data and final data
      const mp3Blob = new Blob([encodedData, finalData], { type: 'audio/mp3' });

      setConversionProgress(100);
      
      setIsConverting(false);
      return mp3Blob;
      
    } catch (err) {
      console.error('MP3 conversion error:', err);
      
      // Provide graceful fallback with original audio
      let errorMessage = 'MP3 변환 중 오류가 발생했습니다. 원본 오디오 파일을 사용합니다.';
      
      if (err.message.includes('Import timeout')) {
        errorMessage = 'MP3 변환 라이브러리 로딩 시간이 초과되었습니다. 원본 오디오 파일을 사용합니다.';
      } else if (err.message.includes('Web Audio API')) {
        errorMessage = '현재 브라우저는 고급 오디오 처리를 지원하지 않습니다. 원본 오디오 파일을 사용합니다.';
      } else if (err.message.includes('WASM')) {
        errorMessage = '현재 브라우저는 WebAssembly를 지원하지 않습니다. 원본 오디오 파일을 사용합니다.';
      }
      
      setError(errorMessage);
      setIsConverting(false);
      
      // Return original blob as fallback instead of null
      return audioBlob;
    }
  }, [checkSupport]);

  const resetConverter = useCallback(() => {
    setIsConverting(false);
    setConversionProgress(0);
    setError(null);
  }, []);

  return {
    convertToMp3,
    isConverting,
    conversionProgress,
    error,
    resetConverter,
    checkSupport,
    isSupported: isSupported !== null ? isSupported : checkSupport()
  };
};

export default useMp3Converter;