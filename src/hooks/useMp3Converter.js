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

      // Process audio in chunks for progress tracking
      const chunkSize = 1024;
      const totalSamples = audioBuffer.length;
      const mp3Data = [];
      
      for (let i = 0; i < totalSamples; i += chunkSize) {
        const end = Math.min(i + chunkSize, totalSamples);
        const chunk = [];
        
        // Extract samples for each channel
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          chunk.push(channelData.slice(i, end));
        }
        
        // Encode chunk
        const encodedData = encoder.encode(chunk);
        if (encodedData.length > 0) {
          mp3Data.push(encodedData);
        }
        
        // Update progress (reserve 10% for finalization)
        const progress = Math.round((end / totalSamples) * 90);
        setConversionProgress(progress);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Finalize encoding
      const finalData = encoder.finalize();
      if (finalData.length > 0) {
        mp3Data.push(finalData);
      }
      
      setConversionProgress(100);
      
      // Create MP3 blob
      const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
      
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