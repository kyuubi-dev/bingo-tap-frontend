import React, { useState, useRef } from 'react';
import './Tap.css';
import BgImage from './BgImage'; // Import the BgImage component

function Tap() {
  const [userBalance, setUserBalance] = useState(0);
  const [energy, setEnergy] = useState(1500);
  const maxEnergy = 1500;
  const lastTapTimeRef = useRef(0); // Track last tap time

  const MIN_TIME_BETWEEN_TAPS = 50; // 50ms debounce time to avoid multiple counts

  const handleClick = (event) => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTimeRef.current;

    if (timeSinceLastTap < MIN_TIME_BETWEEN_TAPS) return; // Skip if last tap was too recent

    // Update last tap time
    lastTapTimeRef.current = currentTime;

    if (energy >= 1) {
      setEnergy((prevEnergy) => prevEnergy - 1);
      setUserBalance((prevBalance) => prevBalance + 1);

      // Adding vibration
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 10ms
      }

      const { clientX, clientY } = event;
      animatePlusOne(clientX, clientY, '+1');
    }
  };

  const handleTouch = (event) => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTimeRef.current;

    if (timeSinceLastTap < MIN_TIME_BETWEEN_TAPS) return; // Skip if last tap was too recent

    // Update last tap time
    lastTapTimeRef.current = currentTime;

    const touches = event.touches;
    if (energy >= touches.length) {
      setEnergy((prevEnergy) => prevEnergy - touches.length);
      setUserBalance((prevBalance) => prevBalance + touches.length);

      // Adding vibration
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 10ms
      }

      Array.from(touches).forEach((touch) => {
        const { clientX, clientY } = touch;
        animatePlusOne(clientX, clientY, '+1');
      });
      const robotImg = document.querySelector('.robot-img');
      robotImg.classList.add('dramatic-shake');
      setTimeout(() => {
        robotImg.classList.remove('dramatic-shake');
      }, 500); // Remove the class after 100ms

    }
  };

  const animatePlusOne = (startX, startY, text) => {
    const coinElement = document.querySelector('.balance-display img');
    const coinRect = coinElement.getBoundingClientRect();
    const endX = coinRect.left + coinRect.width / 2;
    const endY = coinRect.top + coinRect.height / 2;

    const plusOne = document.createElement('span');
    plusOne.className = 'plus-one blue-style';
    plusOne.textContent = text;
    plusOne.style.left = `${startX}px`;
    plusOne.style.top = `${startY}px`;
    document.body.appendChild(plusOne);

    requestAnimationFrame(() => {
      plusOne.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;
      plusOne.style.opacity = '0';
    });

    setTimeout(() => {
      plusOne.remove();
    }, 1000);
  };

  const energyBarWidth = (energy / maxEnergy) * 100 + '%';

  return (
    <div className="Tap">
      <div className="Tap-content">
        <div className='lightnings'>
          <img src='/16.png' className='lightning right' alt="Lightning Right" />
          <img src='/17.png' className='lightning left' alt="Lightning Left" />
        </div>
        <div className="balance-display">
          <img src="/coin.png" alt="Coin" className="coin-icon " />
          <span className="balance-amount blue-style">{userBalance}</span>
        </div>
        <div className="tap-gold">
          <img src='./ranks/gold.png' className='rank-img' alt="Gold Rank" />
          <span className="gold-text gold-style">GOLD</span>
          <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open" />
          </button>
        </div>
        <button
          className="main-button"
          onClick={handleClick}
          onTouchStart={handleTouch}
        >
          <img src="/btns/robotv2.png" alt="Start" className='robot-img'/>
        </button>
        <div className="energy-display">
          <img src='./boost/power.png' className='power-img'/>
          <div className='blue-style'> {energy}/{maxEnergy}</div>
        </div>
        <div className="energy-container">
          <div className="energy-bar" style={{ width: energyBarWidth }}></div>
        </div>
      </div>
    </div>
  );
}

export default Tap;
