import { useState, useEffect } from 'react';
import './ApiKeyInput.css';

const ApiKeyInput = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    // localStorage에서 API 키 불러오기 (선택사항)
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange?.(savedKey);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      onApiKeyChange?.(apiKey.trim());
      setShowInput(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    onApiKeyChange?.(null);
  };

  if (!showInput && !apiKey) {
    return (
      <div className="api-key-notice">
        <div className="notice-content">
          <h3>🔑 OpenAI API 키가 필요합니다</h3>
          <p>음성 전사 기능을 사용하려면 OpenAI API 키를 입력해주세요.</p>
          <button 
            onClick={() => setShowInput(true)}
            className="setup-button"
          >
            API 키 설정하기
          </button>
          <div className="notice-help">
            <small>
              API 키는 브라우저에만 저장되며, 서버로 전송되지 않습니다.
              <br />
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                OpenAI에서 API 키 발급받기 →
              </a>
            </small>
          </div>
        </div>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="api-key-input">
        <div className="input-content">
          <h3>OpenAI API 키 설정</h3>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="key-input"
          />
          <div className="input-actions">
            <button onClick={handleSave} className="save-button">
              저장
            </button>
            <button onClick={() => setShowInput(false)} className="cancel-button">
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-status">
      <span className="status-text">✅ API 키 설정됨</span>
      <button onClick={() => setShowInput(true)} className="edit-button">
        수정
      </button>
      <button onClick={handleClear} className="clear-button">
        삭제
      </button>
    </div>
  );
};

export default ApiKeyInput;