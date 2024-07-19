import React, { useEffect,useState } from 'react';
import './boostModal.css'; // Ensure you have the appropriate styles

const BoostModal = ({ boost, onClose, onBuy, onActivateTG, onActiveFT, autoTapData, handleClaimPoints }) => {
    const [startY, setStartY] = useState(null);
    const [currentY, setCurrentY] = useState(0);
    const [timeLeft, setTimeLeft] = useState(autoTapData.timeLeft);
    useEffect(() => {
        const modal = document.querySelector('.modal');
        modal.classList.add('active');
        return () => modal.classList.remove('active');
    }, []);

    useEffect(() => {
        if (autoTapData.active && autoTapData.timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prevTimeLeft) => {
                    const newTimeLeft = Math.max(prevTimeLeft - 1000, 0);
                    if (newTimeLeft === 0) {
                        onClose();
                        clearInterval(timer);
                    }
                    return newTimeLeft;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [autoTapData.active, autoTapData.timeLeft]);


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
        onClose();
    };

    // Format the remaining time into hours, minutes, and seconds
    const formatRemainingTime = (milliseconds) => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const handleOverlayClick = (event) => {
        if (!event.target.closest('.modal-content')) {
            onClose();
        }
    };

    const handleTouchStart = (event) => {
        const touch = event.touches[0];
        setStartY(touch.clientY);
    };

    const handleTouchMove = (event) => {
        const touch = event.touches[0];
        const deltaY = touch.clientY - startY;

        if (deltaY > 0) {
            setCurrentY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (currentY > 150) { // Порог для закриття вікна, якщо зміщення більше 150 пікселів
            onClose();
        } else {
            setCurrentY(0);
        }
        setStartY(null);
    };

    return (
        <div className="modal" onClick={handleOverlayClick}>
            <div className="modal-content"
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
                 style={{transform: `translateY(${currentY}px)`}}>
                <img src={isAutoTap ? '/boost/click.png' : boost.image} alt={boost.name} className="boost-icon"/>

                <h2 className="boost-name">{boost.name}</h2>

                {isAutoTap && autoTapData.active ? (
                    <div className="auto-tap-info">
                        <div className="auto-tap-timer">Time left: {formatRemainingTime(timeLeft)}</div>
                        <p className="boost-description">{boost.description}</p>
                        <>
                            <div className="auto-tap-points">Accumulated points: {autoTapData.accumulatedPoints}</div>
                            <button className="claim-points-button blue-style" onClick={handleClaimPoints}>
                                {autoTapData.timeLeft === 0 && autoTapData.accumulatedPoints === 0 ? 'START' : `Claim Points`}
                            </button>
                        </>
                    </div>
                ) : (
                    <>
                        <p className="boost-price">Price: {isAutoTap ? 200000 : boost.price}</p>
                        <p className="boost-description">{boost.description}</p>
                        <button className="btn btn-buy blue-style" onClick={handleAction}>
                            GET IT!
                        </button>
                    </>
                )}

                <div className="modal-buttons">
                    <img src="/btns/delete.png" onClick={onClose} alt="Close" className="closeImg"/>
                </div>
            </div>
        </div>
    );


};

export default BoostModal;
