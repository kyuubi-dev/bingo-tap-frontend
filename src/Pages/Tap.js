import React, { useState, useEffect, useRef } from 'react';
import './Tap.css';
import BgImage from './BgImage'; // Import the BgImage component
import Task from './Task.js';
function Tap() {
  const [userBalance, setUserBalance] = useState(0);
  const [energy, setEnergy] = useState(1500);
  const maxEnergy = 1500;
  const intervalRef = useRef(null);

  useEffect(() => {
    // Function to restore 1 energy per second
    const restoreEnergy = () => {
      setEnergy((prevEnergy) => {
        if (prevEnergy < maxEnergy) {
          return prevEnergy + 1;
        }
        return prevEnergy;
      });
    };

    // Start the interval to restore energy
    intervalRef.current = setInterval(restoreEnergy, 1000);

    // Clean up the interval on component unmount
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [maxEnergy]);

  const handleTap = (event) => {
    if (energy > 0) {
      setEnergy((prevEnergy) => prevEnergy - 1);
      setUserBalance((prevBalance) => prevBalance + 1);

      // Adding vibration
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 10ms
      }

      const { clientX, clientY } = event.touches ? event.touches[0] : event;
      animatePlusOne(clientX, clientY, '+1');

      // Add shake animation
      const robotImg = document.querySelector('.robot-img');
      robotImg.classList.add('dramatic-shake');
      setTimeout(() => {
        robotImg.classList.remove('dramatic-shake');
      }, 500); // Remove the class after 300ms
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
    }, 1000); // Remove after 1 second for faster feedback
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
        <div className="tap-gold" >
          <img src='./ranks/gold.png' className='rank-img' alt="Gold Rank" />
          <span className="gold-text gold-style">GOLD</span>
          <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open" />
          </button>
        </div>
        <button
          className="main-button"
          onClick={handleTap}
          onTouchStart={handleTap}
        >
          <img src="/btns/robotv2.png" alt="Start" className='robot-img' />
        </button>
        <div className="energy-display">
          <img src='./boost/power.png' className='power-img' />
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
