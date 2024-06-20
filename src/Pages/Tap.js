import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Tap.css';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useLocation } from 'react-router-dom';
import config from "../config";

function Tap({ telegramId }) {
  const [userBalance, setUserBalance] = useState(0);
  const [energy, setEnergy] = useState(1500);
  const [userLeague, setUserLeague] = useState('');
  const [activeBoosts, setActiveBoosts] = useState([]);
  const maxEnergy = 1500;
  const intervalRef = useRef(null);
  const activeTouches = useRef(new Set());
  const navigate = useNavigate();
  const [purchasedBoosts, setPurchasedBoosts] = useState({});
  const location = useLocation();
  const [timer, setTimer] = useState(null);
  const [isFullTankActive, setIsFullTankActive] = useState(false);

  useEffect(() => {
    const fetchActiveBoosts = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/active-boosts/${telegramId}`);
        setActiveBoosts(response.data.activeBoosts);
      } catch (error) {
        console.error('Error fetching active boosts:', error);
      }
    };

    fetchActiveBoosts();
  }, [telegramId]);

  useEffect(() => {
    const { boostName } = location.state || {};

    if (boostName === 'ENERGY LIMIT') {
      activateFullTank();
    }
  }, [location.state]);

  const activateFullTank = () => {
    setIsFullTankActive(true);
    setEnergy(Infinity); // Устанавливаем бесконечную энергию

    // Включаем таймер на 15 секунд
    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      setIsFullTankActive(false);
      setEnergy(maxEnergy); // Возвращаем энергию к 1500 после окончания действия буста
    }, 15000); // 15 секунд

    setTimer(newTimer);
  };

  // Функция для загрузки баланса пользователя
  const loadUserBalance = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${telegramId}`);
      const userData = response.data;
      if (userData.userExists) {
        setUserBalance(userData.userBalance); // Обновление в основном компоненте
        setUserLeague(userData.userLeague); // Обновлення ліги користувача
      }
    } catch (error) {
      console.error('Ошибка при загрузке баланса пользователя:', error);
    }
  };

  // Функция для сохранения баланса пользователя
  const saveUserBalance = async (newBalance) => {
    try {
      await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
        balance: newBalance
      });
      setUserBalance(newBalance); // Обновление баланса в состоянии
    } catch (error) {
      console.error('Ошибка при сохранении баланса пользователя:', error);
    }
  };

  useEffect(() => {
    // Загрузка баланса при монтировании компонента и при изменении telegramId
    loadUserBalance();
  }, [telegramId]);

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
      saveUserBalance();
    };
  }, [maxEnergy, userBalance]);

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

  const handleMouseDown = (event) => {
    event.preventDefault();
    handleTap(event.clientX, event.clientY);
  };

  const handleTouchStart = (event) => {
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

  useEffect(() => {
    const mainButton = document.querySelector('.main-button');
    mainButton.addEventListener('touchstart', handleTouchStart, { passive: false });
    mainButton.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      mainButton.removeEventListener('touchstart', handleTouchStart);
      mainButton.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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
            <img src='/16.png' className='lightning right' alt="Lightning Right"/>
            <img src='/17.png' className='lightning left' alt="Lightning Left"/>
          </div>
          <div className="balance-display">
            <img src="/coin.png" alt="Coin" className="coin-icon"/>
            <span className="balance-amount blue-style">{userBalance}</span>
          </div>
          <div className="tap-gold" onClick={handleGoldButtonClick}>
            <img src={getLeagueImage(userLeague)} className='rank-img' alt="Gold Rank"/>
            <span className="gold-text gold-style">{userLeague.toUpperCase()}</span>
            <button className='open-btn'>
              <img src='./tasks/open.png' className='open-icon' alt="Open"/>
            </button>
          </div>
          <button
              className="main-button"
              onMouseDown={handleMouseDown}
          >
            <img src="/btns/robotv2.png" alt="Start" className='robot-img'/>
          </button>
          <div className="energy-display">
            <img src='./boost/power.png' className='power-img' alt="Power"/>
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
