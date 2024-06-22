import React, { useState, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import './Tap.css';
import config from "../config";
import { useNavigate } from 'react-router-dom';

function Tap({ telegramId }) {
  const [energy, setEnergy] = useState(1500);
  const maxEnergy = 1500;
  const [userBalance, setUserBalance] = useState(0);
  const ws = useRef(null);
  const navigate = useNavigate();
  const [userLeague, setUserLeague] = useState('');
  const [multitapLevel, setMultitapLevel] = useState(1);
  const audioRef = useRef(new Audio('../haptics.mp3')); // Аудиофайл
  useEffect(() => {
    const url = `${config.wsBaseUrl}`; // Replace localhost with your server
    ws.current = new ReconnectingWebSocket(url);
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current.send(JSON.stringify({
        type: 'requestUserData',
        telegram_id: 874423521
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'userData') {
        setUserBalance(data.balance);
        setUserLeague(data.league);
      } else if (data.type === 'balanceUpdate' && data.telegram_id === telegramId) {
        setUserBalance(data.newBalance);
      } else if (data.type === 'error') {
        console.error(data.message);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    return () => {
      ws.current.close();
    };
  }, [telegramId]);

  const handleEvent = (event) => {
    // Determine click or touch coordinates and number of touches
    let clientX, clientY, touches;
    if (event.type === 'touchstart') {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
      touches = event.touches.length;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
      touches = 1;
    }

    // Call function to handle tap
    handleTap(clientX, clientY, touches);
  };

  const handleTap = (clientX, clientY) => {
    const newBalance = userBalance + multitapLevel;
    setUserBalance(newBalance);

    // Send updated balance to the server
    ws.current.send(JSON.stringify({
      type: 'updateBalance',
      telegram_id: 874423521,
      newBalance: newBalance
    }));

    // Trigger the tap animation
    animatePlusOne(clientX, clientY, `+${multitapLevel}`);

    // Trigger vibration and audio feedback
    if (navigator.vibrate) {
      navigator.vibrate(100); // Vibrate for 100ms
    }
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
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
    }, 500);
  };

  const energyBarWidth = (energy / maxEnergy) * 100 + '%';
  const getLeagueImage = (league) => {
    switch (league.toUpperCase()) {
      case 'SILVER':
        return './ranks/blue.png';
      case 'GOLD':
        return './ranks/gold.png';
      case 'DIAMOND':
        return './ranks/neon.png';
      default:
        return './ranks/blue.png';
    }
  };
  const handleGoldButtonClick = () => {
    navigate('/task?tab=leagues', { state: { userBalance } });
  };

  return (
      <div className="Tap">
        <div className="Tap-content">
          <div className='lightnings'>
            <img src='/16.png' className='lightning right' alt="Lightning Right" />
            <img src='/17.png' className='lightning left' alt="Lightning Left" />
          </div>
          <div className="balance-display">
            <img src="/coin.png" alt="Coin" className="coin-icon" />
            <span className="balance-amount blue-style">{userBalance}</span>
          </div>
          <div className="tap-gold" onClick={handleGoldButtonClick}>
            <img src={getLeagueImage(userLeague)} className='rank-img' alt="Gold Rank" />
            <span className="gold-text gold-style">{userLeague.toUpperCase()}</span>
            <button className='open-btn'>
              <img src='./tasks/open.png' className='open-icon' alt="Open" />
            </button>
          </div>
          <button
              className="main-button"
              onClick={handleEvent}
              onTouchStart={handleEvent}
          >
            <img src="/btns/robotv2.png" alt="Start" className='robot-img' />
          </button>
          <div className="energy-display">
            <img src='./boost/power.png' className='power-img' alt="Power" />
            <div className='blue-style'>{energy}/{maxEnergy}</div>
          </div>
          <div className="energy-container">
            <div className="energy-bar" style={{ width: energyBarWidth }}></div>
          </div>
        </div>
      </div>
  );
}

export default Tap;
