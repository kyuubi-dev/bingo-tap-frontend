import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Tap.css';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

function Tap({ userId, setUserBalance }) {
  const [userBalance, setUserBalanceState] = useState(0);
  const [energy, setEnergy] = useState(1500);
  const maxEnergy = 1500;
  const intervalRef = useRef(null);
  const activeTouches = useRef(new Set());
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(10000); // начальные очки
  const [purchasedBoosts, setPurchasedBoosts] = useState({});

  // Функция для загрузки баланса пользователя
  const loadUserBalance = async () => {
    try {
      if (userId) {
        const response = await axios.get(`http://localhost:8000/api/user-balance/${userId}`);
        const balance = response.data.balance;
        setUserBalanceState(balance); // Локальное состояние
        setUserBalance(balance); // Обновление в основном компоненте
      }
    } catch (error) {
      console.error('Ошибка при загрузке баланса пользователя:', error);
    }
  };

  useEffect(() => {
    // Загрузка баланса при монтировании компонента
    loadUserBalance();
  }, [userId]); // Зависимость от userId, чтобы перезагрузить баланс при его изменении

  useEffect(() => {
    const restoreEnergy = () => {
      setEnergy((prevEnergy) => {
        if (prevEnergy < maxEnergy) {
          return prevEnergy + 1;
        }
        return prevEnergy;
      });
    };

    intervalRef.current = setInterval(restoreEnergy, 1500);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [maxEnergy]);

  const hapticsVibrate = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  };

  const handleTap = (clientX, clientY) => {
    const robotImg = document.querySelector('.robot-img');
    const robotRect = robotImg.getBoundingClientRect();

    if (
        clientX >= robotRect.left &&
        clientX <= robotRect.right &&
        clientY >= robotRect.top &&
        clientY <= robotRect.bottom
    ) {
      if (energy > 0) {
        const tapValue = purchasedBoosts['Taping Guru'] ? 5 : 1;
        setEnergy((prevEnergy) => prevEnergy - 1);
        setUserBalanceState((prevBalance) => prevBalance + tapValue);
        setUserBalance((prevBalance) => prevBalance + tapValue);

        hapticsVibrate();

        animatePlusOne(clientX, clientY, `+${tapValue}`);

        robotImg.classList.add('dramatic-shake');
        setTimeout(() => {
          robotImg.classList.remove('dramatic-shake');
        }, 500);
      }
    }
  };

  const handleMouseDown = (event) => {
    event.preventDefault();
    handleTap(event.clientX, event.clientY);
  };

  const handleTouchStart = (event) => {
    event.preventDefault();

    const touches = Array.from(event.changedTouches);
    touches.forEach(touch => {
      if (!activeTouches.current.has(touch.identifier)) {
        activeTouches.current.add(touch.identifier);
        handleTap(touch.clientX, touch.clientY);
      }
    });
  };

  const handleTouchEnd = (event) => {
    const touches = Array.from(event.changedTouches);
    touches.forEach(touch => {
      if (activeTouches.current.has(touch.identifier)) {
        activeTouches.current.delete(touch.identifier);
      }
    });
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

  const handleGoldButtonClick = () => {
    navigate('/task?tab=leagues', { state: { userBalance } });
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
            <img src="/coin.png" alt="Coin" className="coin-icon" />
            <span className="balance-amount blue-style">{userBalance}</span>
          </div>
          <div className="tap-gold" onClick={handleGoldButtonClick}>
            <img src='./ranks/gold.png' className='rank-img' alt="Gold Rank" />
            <span className="gold-text gold-style">GOLD</span>
            <button className='open-btn'>
              <img src='./tasks/open.png' className='open-icon' alt="Open" />
            </button>
          </div>
          <button
              className="main-button"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
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
