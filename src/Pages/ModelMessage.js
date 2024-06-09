import React from 'react';
import './ModelMessage.css';

const CompletionMessage = ({ message, onClose }) => {
    return (
        <div className="completion-message-overlay">
            <div className="completion-message-container">
                <div className="completion-message-text">{message}</div>
                <button className="completion-message-button gold-style" onClick={onClose}>Okey</button>
            </div>
        </div>
    );
};

export default CompletionMessage;
