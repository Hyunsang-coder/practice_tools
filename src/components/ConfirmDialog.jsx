import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소' }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
                <div className="confirm-dialog-content">
                    <div className="confirm-dialog-icon">⚠️</div>
                    <h3 className="confirm-dialog-title">확인</h3>
                    <p className="confirm-dialog-message">{message}</p>
                    <div className="confirm-dialog-actions">
                        <button
                            className="confirm-dialog-button cancel-button"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                        <button
                            className="confirm-dialog-button confirm-button"
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog; 