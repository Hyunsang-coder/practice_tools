import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error tracking service in production
    if (import.meta.env.PROD) {
      // You can integrate with error tracking services like Sentry here
      console.error('Production error caught by ErrorBoundary:', {
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        errorId: this.state.errorId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Determine error severity and type
      const isRecordingError = this.state.error?.message?.includes('recording') || 
                              this.state.error?.message?.includes('microphone') ||
                              this.state.error?.message?.includes('MediaRecorder');
      
      const isBrowserCompatError = this.state.error?.message?.includes('not supported') ||
                                  this.state.error?.name === 'NotSupportedError';

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            
            <h1 className="error-title">
              {isBrowserCompatError ? '브라우저 호환성 문제' : 
               isRecordingError ? '녹음 기능 오류' : 
               '예상치 못한 오류가 발생했습니다'}
            </h1>
            
            <div className="error-description">
              {isBrowserCompatError ? (
                <div>
                  <p>현재 브라우저에서 일부 기능이 지원되지 않습니다.</p>
                  <ul>
                    <li>Chrome, Firefox, Safari 최신 버전을 사용해보세요</li>
                    <li>HTTPS 연결에서만 마이크 접근이 가능합니다</li>
                    <li>브라우저 설정에서 마이크 권한을 확인해보세요</li>
                  </ul>
                </div>
              ) : isRecordingError ? (
                <div>
                  <p>오디오 녹음 중 문제가 발생했습니다.</p>
                  <ul>
                    <li>마이크가 다른 프로그램에서 사용 중인지 확인해보세요</li>
                    <li>브라우저를 새로고침하고 다시 시도해보세요</li>
                    <li>마이크 권한이 허용되었는지 확인해보세요</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p>죄송합니다. 처리 중 예상치 못한 문제가 발생했습니다.</p>
                  <p>잠시 후 다시 시도해보시거나, 페이지를 새로고침해주세요.</p>
                </div>
              )}
            </div>

            {/* Error ID for support */}
            <div className="error-id">
              <small>오류 ID: {this.state.errorId}</small>
            </div>

            {/* Action buttons */}
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="error-button retry-button"
              >
                다시 시도
              </button>
              <button 
                onClick={this.handleGoHome}
                className="error-button home-button"
              >
                홈으로 이동
              </button>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>개발자 정보 (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;