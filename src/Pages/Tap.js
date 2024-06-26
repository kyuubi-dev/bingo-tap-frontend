import React, { useState, useEffect, useRef } from 'react';
import './Tap.css';
import config from "../config";
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import leagues from "./leaguaData";
import axios from 'axios';
import useSwipe from './useSwipe'; // Импортируем хук

function Tap({ telegramId , ws}) {
  const [maxEnergy, setMaxEnergy] = useState(1500);
  const [energy, setEnergy] = useState(1500);
  const [cachedBalance, setCachedBalance] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userLeague, setUserLeague] = useState('');
  const [multitapLevel, setMultitapLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [tapingGuruActive, setTapingGuruActive] = useState(location.state?.tapingGuruActive || false); // додано для Taping Guru
  const audioRef = useRef(null);
  const [boostActive, setBoostActive] = useState(false);
  const energyInterval = useRef(null);
  const [rechargeSpeed, setRechargeSpeed] = useState(1);
  const tapingGuruTimeout = useRef(null);
  const tapRef = useRef(null); // Создаем реф для элемента, который будем отслеживать
  useSwipe(tapRef); // Применяем хук

  useEffect(() => {
      ws.send(JSON.stringify({
        type: 'requestUserData',
        telegram_id: telegramId
      }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'userData') {
        if (data.balance != null) { setUserBalance(data.balance); setCachedBalance(data.balance); }
        if (data.league != null) setUserLeague(data.league);
        if (data.multiTapLevel != null) setMultitapLevel(data.multiTapLevel);
        if (data.energyLimitLevel != null) setMaxEnergy(1000 + data.energyLimitLevel * 500);
        if (data.rechargingSpeed != null) setRechargeSpeed(data.rechargingSpeed);
        if (data.energy != null) setEnergy(data.energy);
        setIsLoaded(true);
      } else if (data.type === 'balanceUpdate' && data.telegram_id === telegramId) {
        if (data.newBalance != null) { setUserBalance(data.newBalance); setCachedBalance(data.newBalance); }
        if (data.newEnergy != null) setEnergy(data.newEnergy);
      } else if (data.type === 'error') {
        console.error(data.message);
      }
    };
  }, [telegramId]);

  useEffect(() => {
    energyInterval.current = setInterval(() => {
      setEnergy((prevEnergy) => {
        if (prevEnergy < maxEnergy) {
          return Math.min(prevEnergy + rechargeSpeed, maxEnergy); // обмежуємо максимальну енергію
        }
        return prevEnergy;
      });
    }, 750);

    const handleUnload = async () => {
      if (cachedBalance !== userBalance || energy !== maxEnergy) {
        try {
          await saveData();
          console.log('Balance and energy saved successfully');
        } catch (error) {
          console.error('Error saving balance and energy:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      clearInterval(energyInterval.current);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [cachedBalance, userBalance,energy,maxEnergy, rechargeSpeed, telegramId]);

  useEffect(() => {
    if (tapingGuruActive) {
      tapingGuruTimeout.current = setTimeout(() => {
        setTapingGuruActive(false);
      }, 20000); // 20 секунд

      return () => {
        clearTimeout(tapingGuruTimeout.current);
      };
    }
  }, [tapingGuruActive]);


  useEffect(() => {
    const saveDataOnRouteChange = async () => {
      if (cachedBalance !== userBalance || energy !== maxEnergy) {
        try {
          await saveData();
          console.log('Balance and energy saved successfully');
        } catch (error) {
          console.error('Error saving balance and energy:', error);
        }
      }
    };

    saveDataOnRouteChange();

    return () => {
      saveDataOnRouteChange();
    };
  }, [location]);

  // Save balance on route change
  useEffect(() => {
    const saveBalanceOnRouteChange = async () => {
      if (cachedBalance !== userBalance) {
        try {
          await saveData();
          console.log('Balance saved successfully');
        } catch (error) {
          console.error('Error saving balance:', error);
        }
      }
    };

    saveBalanceOnRouteChange();

    return () => {
      saveBalanceOnRouteChange();
    };
  }, [location]);

  const saveData = async () => {
    return new Promise((resolve, reject) => {
      if (cachedBalance !== userBalance || energy !== maxEnergy) {
        ws.send(JSON.stringify({
          type: 'updateBalance',
          telegram_id: telegramId,
          newBalance: cachedBalance,
          newEnergy: energy
        }), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  };

  useEffect(() => {
    // Збереження балансу та енергії в локальне сховище при їх зміні
    localStorage.setItem('userBalance', cachedBalance.toString());
    localStorage.setItem('energy', energy.toString());
  }, [cachedBalance, energy]);


  const handleEvent = (event) => {
    if (!isLoaded) {
      console.log('Data not loaded yet');
      return;
    }

    if (event.type === 'touchstart') {
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        handleTap(clientX, clientY);
      }
    }
  };
  const updateUserLeague = async (telegramId) => {
    try {

      const response = await axios.put(`${config.apiBaseUrl}/update-league/${telegramId}`);

      if (response.status !== 200) {
        throw new Error('Failed to update league');
      }

      const data = response.data;
      setUserLeague(data.league);

    } catch (error) {
      console.error('Update league error:', error);
    }
  };

  const handleTap = (clientX, clientY) => {
    if (energy > 0) {
      const pointsEarned = tapingGuruActive ? multitapLevel * 5 : multitapLevel;
      const newBalance = cachedBalance + pointsEarned;
      setCachedBalance(newBalance);
      if (!tapingGuruActive) {
        setEnergy((prevEnergy) => {
          const newEnergy = prevEnergy - pointsEarned;
          return newEnergy >= 0 ? newEnergy : 0; // перевірка, щоб енергія не була від'ємною
        });
      }

      if (newBalance - userBalance >= 50) {
        setUserBalance(newBalance);
        ws.send(JSON.stringify({
          type: 'updateBalance',
          telegram_id: telegramId,
          newBalance: newBalance,
          newEnergy: energy
        }));
        updateUserLeague(telegramId);
      }

      animatePlusOne(clientX, clientY, `+${pointsEarned}`);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      console.log('Not enough energy to tap');
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
    const leagueData = leagues.find(l => l.name.toUpperCase() === league.toUpperCase());
    return leagueData ? leagueData.img : './ranks/wood.png';
  };

  const handleGoldButtonClick = () => {
    navigate('/task?tab=leagues');
  };

  if (!isLoaded) {
    return <LoadingScreen />;
  }
  const createExplosionEffect = (element) => {
    const rect = element.getBoundingClientRect();
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${rect.left + rect.width / 2 - 50}px`; // Відцентрувати вибух
    explosion.style.top = `${rect.top + rect.height / 2 - 50}px`; // Відцентрувати вибух
    document.body.appendChild(explosion);

    setTimeout(() => {
      explosion.remove();
    }, 2000); // Видалити вибух після анімації
  };
  return (
      <div className="Tap" ref={tapRef}>
        <div className="Tap-content">
          <div className='lightnings'>
            <img src='/16.png' className='lightning right' alt="Lightning Right" />
            <img src='/17.png' className='lightning left' alt="Lightning Left" />
          </div>
          <div className="balance-display">
            <img src="/coin.png" alt="Coin" className="coin-icon" />
            <span className="balance-amount blue-style">{cachedBalance}</span>
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
            <img src={tapingGuruActive ? "/btns/2.png" : "/btns/1.png"} alt="Start"
                 className={`robot-img ${tapingGuruActive ? 'robot-large' : 'robot-normal'}`}
            />
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
