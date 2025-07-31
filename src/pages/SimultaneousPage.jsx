import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SimultaneousPage.css';

const BASE_WPM = 100; // 기본 100 WPM

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5배 (50 WPM)', wpm: BASE_WPM * 0.5 },
  { value: 0.7, label: '0.7배 (70 WPM)', wpm: BASE_WPM * 0.7 },
  { value: 0.9, label: '0.9배 (90 WPM)', wpm: BASE_WPM * 0.9 },
  { value: 1.0, label: '1.0배 (100 WPM)', wpm: BASE_WPM * 1.0 },
  { value: 1.3, label: '1.3배 (130 WPM)', wpm: BASE_WPM * 1.3 },
  { value: 1.5, label: '1.5배 (150 WPM)', wpm: BASE_WPM * 1.5 }
];

const SUPPORTED_FORMATS = {
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.flac']
};

function SimultaneousPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedScript, setExtractedScript] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setExtractedScript('');
      setProcessingProgress(0);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setExtractedScript('');
      setProcessingProgress(0);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const isValidFileType = (file) => {
    const fileName = file.name.toLowerCase();
    const allFormats = [...SUPPORTED_FORMATS.video, ...SUPPORTED_FORMATS.audio];
    return allFormats.some(format => fileName.endsWith(format));
  };

  const getFileType = (file) => {
    const fileName = file.name.toLowerCase();
    if (SUPPORTED_FORMATS.video.some(format => fileName.endsWith(format))) {
      return 'video';
    }
    if (SUPPORTED_FORMATS.audio.some(format => fileName.endsWith(format))) {
      return 'audio';
    }
    return 'unknown';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateScriptExtraction = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProcessingProgress(i);
    }

    // Simulate extracted script (placeholder)
    const mockScript = `Hello everyone, welcome to today's presentation. Today we'll be discussing the latest developments in artificial intelligence and how they impact our daily lives. The rapid advancement of AI technology has brought significant changes to various industries including healthcare, education, and finance. We need to understand both the opportunities and challenges that come with these technological innovations.`;

    setExtractedScript(mockScript);
    setIsProcessing(false);
  };

  const handleStartPractice = () => {
    if (!selectedFile) {
      alert('연습할 파일을 선택해주세요.');
      return;
    }

    if (!isValidFileType(selectedFile)) {
      alert('지원하지 않는 파일 형식입니다.');
      return;
    }

    const practiceData = {
      mode: 'simultaneous',
      file: selectedFile,
      playbackSpeed: parseFloat(playbackSpeed),
      originalScript: extractedScript
    };

    navigate('/practice', { state: practiceData });
  };

  return (
    <div className="simultaneous-page">
      <header className="page-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 홈으로
        </button>
        <h1>동시통역 연습 준비</h1>
        <p>영상이나 음성 파일을 업로드하고 설정을 선택하세요</p>
      </header>

      <main className="preparation-content">
        <div className="file-upload-section">
          <h2>파일 업로드</h2>

          <div
            className="file-drop-zone"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={[...SUPPORTED_FORMATS.video, ...SUPPORTED_FORMATS.audio].join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <div className="file-info">
                <div className="file-icon">
                  {getFileType(selectedFile) === 'video' ? '🎥' : '🎵'}
                </div>
                <div className="file-details">
                  <strong>{selectedFile.name}</strong>
                  <p>{formatFileSize(selectedFile.size)} • {getFileType(selectedFile).toUpperCase()}</p>
                  {isValidFileType(selectedFile) ? (
                    <span className="file-status valid">✓ 지원되는 형식</span>
                  ) : (
                    <span className="file-status invalid">✗ 지원하지 않는 형식</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="drop-zone-content">
                <div className="upload-icon">📁</div>
                <h3>파일을 끌어다 놓거나 클릭하여 선택</h3>
                <p>지원 형식: MP4, MOV, AVI, MP3, WAV, M4A</p>
                <p>최대 크기: 500MB</p>
              </div>
            )}
          </div>

          <div className="supported-formats">
            <h4>지원되는 파일 형식</h4>
            <div className="format-groups">
              <div className="format-group">
                <strong>영상:</strong> {SUPPORTED_FORMATS.video.join(', ')}
              </div>
              <div className="format-group">
                <strong>음성:</strong> {SUPPORTED_FORMATS.audio.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {selectedFile && isValidFileType(selectedFile) && (
          <div className="script-extraction-section">
            <h2>스크립트 추출</h2>

            {!extractedScript && !isProcessing ? (
              <div className="extraction-info">
                <p>파일에서 음성을 추출하여 원본 스크립트를 생성합니다.</p>
                <button
                  className="extract-button"
                  onClick={simulateScriptExtraction}
                >
                  스크립트 추출하기
                </button>
              </div>
            ) : isProcessing ? (
              <div className="processing-status">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p>스크립트 추출 중... {processingProgress}%</p>
              </div>
            ) : (
              <div className="extracted-script">
                <h4>추출된 스크립트 (미리보기)</h4>
                <div className="script-preview">
                  {extractedScript}
                </div>
                <p className="script-note">
                  * 실제 연습에서는 이 스크립트와 비교하여 결과를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="settings-section">
          <h2>재생 설정</h2>

          <div className="speed-selection">
            <h3>재생 속도</h3>
            <div className="speed-slider-container">
              <label className="speed-display">
                {playbackSpeed}배 ({Math.round(BASE_WPM * playbackSpeed)} WPM)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="speed-slider-setup"
              />
              <div className="speed-markers">
                <span>0.5배</span>
                <span>1.0배</span>
                <span>1.5배</span>
              </div>
            </div>
          </div>

          <div className="practice-info">
            <h3>연습 방법</h3>
            <ul>
              <li>업로드한 영상/음성이 재생됩니다</li>
              <li>들으면서 동시에 영어로 통역하세요</li>
              <li>녹음 버튼을 눌러 통역 내용을 기록할 수 있습니다</li>
              <li>연습 완료 후 원본 스크립트와 비교할 수 있습니다</li>
            </ul>
          </div>
        </div>

        <div className="action-section">
          <button
            className="start-practice-button"
            onClick={handleStartPractice}
            disabled={!selectedFile || !isValidFileType(selectedFile) || isProcessing}
          >
            {isProcessing ? '처리 중...' : '연습 시작하기'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default SimultaneousPage;