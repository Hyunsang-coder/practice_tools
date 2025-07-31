import React from 'react';
import styles from './ConversionProgressDialog.module.css';

const ConversionProgressDialog = ({ isOpen, progress, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.iconContainer}>
          <div className={styles.convertIcon}>🎵</div>
        </div>
        <h3>MP3 변환 중...</h3>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{progress}%</span>
        </div>
        <p>잠시만 기다려주세요. 오디오를 MP3 형식으로 변환하고 있습니다.</p>
        {progress < 100 && (
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversionProgressDialog;