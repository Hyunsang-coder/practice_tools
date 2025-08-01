import { useState, useCallback } from 'react';

const useMp3Converter = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState(null);

  const convertToMp3 = useCallback(async (audioBlob) => {
    setIsConverting(true);
    setConversionProgress(0);
    setError(null);

    try {
      // Dynamic import to reduce bundle size
      const { createMp3Encoder } = await import('wasm-media-encoders');
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
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
      setError('MP3 변환 중 오류가 발생했습니다.');
      setIsConverting(false);
      return null;
    }
  }, []);

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
    resetConverter
  };
};

export default useMp3Converter;