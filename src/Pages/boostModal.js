import React from 'react';
import './boostModal.css'; // Ensure you have the appropriate styles

const BoostModal = ({ boost, onClose, onBuy, onActivateTG, onActiveFT, autoTapData, handleClaimPoints }) => {
    if (!boost) return null;

    const isTapingGuru = boost.name === 'TAPING GURU';
    const isFullTank = boost.name === 'FULL TANK';
    const isAutoTap = boost.name === 'AUTO TAP';

    const handleAction = () => {
        if (isTapingGuru) {
            onActivateTG();
        } else if (isFullTank) {
            onActiveFT();
        } else {
            onBuy(boost);
        }
    };

    // Format the remaining time into hours and minutes
    const formatRemainingTime = (milliseconds) => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <img src={boost.image} alt={boost.name} className="boost-icon" />
                <h2 className="boost-name">{boost.name}</h2>
                <p className="boost-price">Price: {boost.price}</p>
                <p className="boost-description">{boost.description}</p>

                {isAutoTap && autoTapData.active &&(
                    <div className="auto-tap-info">
                        <div className="auto-tap-timer">Time left: {formatRemainingTime(autoTapData.timeLeft)}</div>
                        <div className="auto-tap-points">Accumulated points: {autoTapData.accumulatedPoints}</div>
                        <button className="claim-points-button" onClick={handleClaimPoints}>Claim Points</button>
                    </div>
                )}

                <div className="modal-buttons">
                    <button className="btn btn-buy" onClick={handleAction}>
                        {isTapingGuru || isFullTank ? "Activate" : "Buy"}
                    </button>
                    <button className="btn btn-close" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default BoostModal;
