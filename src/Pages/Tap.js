import React, { useState } from 'react';
import './Tap.css';


function Tap() {
  const [userBalance, setUserBalance] = React.useState(0); 
  const [energy, setEnergy] = React.useState(1500); 
  const maxEnergy = 1500;

  
  const handleMainButtonClick = (event) => {
    if (energy >= 1) {
      setEnergy(prevEnergy => prevEnergy - 1);
      setUserBalance(prevBalance => prevBalance + 1); // Update user balance
      const { offsetX, offsetY } = event.nativeEvent;
      const plusOne = document.createElement('span');
      plusOne.classList.add('plus-one');
      plusOne.textContent = '+1';
      plusOne.style.left = `${offsetX}px`;
      plusOne.style.top = `${offsetY}px`;
      event.currentTarget.appendChild(plusOne);
      setTimeout(() => {
        plusOne.remove();
      },  1500);
    }
  };
  

  const energyBarWidth = (energy / maxEnergy) * 100 + '%';

  return (
    <div className="Tap">
    <div className='bg-image'/>
      <div className="Tap-content">
        <div className="balance-display">
          <img src="/coin.png" alt="Coin" className="coin-icon" />
          <span className="balance-amount">{userBalance}</span>
        </div>
        <div className="tap-gold">
          <img src='./ranks/gold.png' className='rank-img' alt="Gold Rank" />
          <span className="gold-text">GOLD</span>
          <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open" />
          </button>
        </div>
        <button className="main-button" onClick={handleMainButtonClick}>
          <img src="/btns/robot.png" alt="Start" />
        </button>
        <div className="energy-display">  
        <img src='./boost/power.png' className='power-img'/>
         <div> {energy}/{maxEnergy}</div>
          </div>
          <div className="energy-container">
            <div className="energy-bar" style={{ width: energyBarWidth }}></div> 
        </div>
      </div>
     
    </div>
  );
}

export default Tap;
