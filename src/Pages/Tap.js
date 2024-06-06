import React, { useState } from 'react';
import './Tap.css';

function Tap() {
  const [userBalance, setUserBalance] = useState(0); 
  const [energy, setEnergy] = useState(1500); 
  const maxEnergy = 1500;

  const handleClick = (event) => {
    if (energy >= 1) {
      setEnergy((prevEnergy) => prevEnergy - 1);
      setUserBalance((prevBalance) => prevBalance + 1);
      
      // Adding vibration
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 50ms
      }

      const { clientX, clientY } = event;
      animatePlusOne(clientX, clientY, '+1');
    }
  };

  const handleTouch = (event) => {
    const touches = event.touches;
    const numTouches = Math.min(touches.length, 4); // Limit to 4 touches

    if (numTouches > 1 && energy >= numTouches) {
      setEnergy((prevEnergy) => prevEnergy - numTouches);
      setUserBalance((prevBalance) => prevBalance + numTouches);

      // Adding vibration
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 50ms
      }

      Array.from(touches).slice(0, numTouches).forEach((touch) => {
        const { clientX, clientY } = touch;
        animatePlusOne(clientX, clientY, `+${numTouches}`);
      });
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
    }, 2000);
  };

  const energyBarWidth = (energy / maxEnergy) * 100 + '%';

  return (
    <div className="Tap">
      <div className="Tap-content">
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
