  import React, { useState, useEffect,useCallback, useRef } from 'react';
  import './Tap.css';
  import config from "../config";
  import { useNavigate, useLocation } from 'react-router-dom';
  import LoadingScreen from './LoadingScreen';
  import leagues from "./leaguaData";
  import axios from 'axios';
  import useSwipe from './useSwipe'; // Импортируем хук
  import BoostModal from './boostModal.js';
  import CompletionMessage from "./ModelMessage"; // Импортируем BoostModal
  function Tap({ telegramId , ws,setShowBoostModal  }) {
    const [maxEnergy, setMaxEnergy] = useState(1500);
    const [energy, setEnergy] = useState(1500);
    const [userBalance, setUserBalance] = useState(0);
    const [userLeague, setUserLeague] = useState('');
    const [multitapLevel, setMultitapLevel] = useState(1);
    const [isLoaded, setIsLoaded] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [tapingGuruActive, setTapingGuruActive] = useState(location.state?.tapingGuruActive || false); // додано для Taping Guru
    const audioRef = useRef(null);
    const [boostActive, setBoostActive] = useState(false);
    const energyInterval = useRef(null);
    const [rechargeSpeed, setRechargeSpeed] = useState(1);
    const tapingGuruTimeout = useRef(null);
    const tapRef = useRef(null); // Создаем реф для элемента, который будем отслеживать
    const [autoTapData, setAutoTapData] = useState({
      active: false,
      accumulatedPoints: 0,
      timeLeft: 0,
      lastUpdate: null
    });
    const [showBoostModal, setShowBoostModalLocal] = useState(false);
    const [message, setMessage] = useState(null);
    const energyRef = useRef(energy);
    const balanceRef = useRef(userBalance);
    const tapingGuruActiveRef = useRef(tapingGuruActive);
    const [tapingBalance, setTapingBalance] = useState(0);
    const tapingBalanceRef = useRef(0);
    window.Telegram.WebApp.disableVerticalSwipes()
    useEffect(() => {
      energyRef.current = energy;
    }, [energy]);

    useEffect(() => {
      balanceRef.current = userBalance;
    }, [userBalance]);
    useEffect(() => {
      tapingGuruActiveRef.current = tapingGuruActive;
    }, [tapingGuruActive]);
    useEffect(() => {
      tapingBalanceRef.current = tapingBalance;
    }, [tapingBalance]);
  useEffect(()=>{
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      disableVerticalSwipes(tg);
    }
  },[]);
    const disableVerticalSwipes = (tg) => {
      if (tg.isVerticalSwipesEnabled !== undefined) {
        tg.isVerticalSwipesEnabled = false; // Вимикає вертикальні свайпи
      }
    };
    useEffect(() => {
        ws.send(JSON.stringify({
          type: 'requestUserData',
          telegram_id: telegramId
        }));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'userData') {
          if (data.userTotalBalance != null) {
            console.log('Setting user balance:', data.userTotalBalance); // Add logging
            setUserBalance(data.userTotalBalance);
          }
          if (data.userTapingBalance != null) {
            setTapingBalance(data.userTapingBalance);
          }
          if (data.league != null) setUserLeague(data.league);
          if (data.multiTapLevel != null) setMultitapLevel(data.multiTapLevel);
          if (data.energyLimitLevel != null) setMaxEnergy(1000 + data.energyLimitLevel * 500);
          if (data.rechargingSpeed != null) setRechargeSpeed(data.rechargingSpeed);
          if (data.energy != null) setEnergy(data.energy);
          if (data.autoTap) {
            setAutoTapData({
              active: data.autoTap.active,
              accumulatedPoints: data.autoTap.accumulatedPoints,
              timeLeft: data.autoTap.timeLeft,
              lastUpdate: data.autoTap.lastUpdate
            });
          };
          if (data.autoTap && data.autoTap.active && data.autoTap.accumulatedPoints > 0 && data.autoTap.timeLeft === 0) {
              setShowBoostModal(true);
              setShowBoostModalLocal(true);
          }
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
        if (energyRef.current !== maxEnergy) {
          await saveEnergy();
        }
        await saveData();
      };
// Оновлювати енергію кожні 5 секунд
      const saveEnergyInterval = setInterval(() => {
        if (energyRef.current !== maxEnergy) {
          saveEnergy();
        }
      }, 5000); // 5 секунд
      window.Telegram.WebApp.onEvent('backButtonClicked', handleUnload);
// Якщо ви хочете також обробляти подію при мінімізації додатка
      window.Telegram.WebApp.onEvent('mainButtonClicked', handleUnload);
      window.Telegram.WebApp.onEvent('popupClosed', handleUnload);
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('unload', handleUnload);

      window.Telegram.WebApp.onEvent('web_app_close', handleUnload);

// Якщо ви хочете також обробляти подію при мінімізації додатка
      window.Telegram.WebApp.onEvent('web_app_minimize', handleUnload);
      return () => {
        clearInterval(energyInterval.current);
        clearInterval(saveEnergyInterval);
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('unload', handleUnload);
        window.Telegram.WebApp.offEvent('backButtonClicked', handleUnload);
        window.Telegram.WebApp.offEvent('mainButtonClicked', handleUnload);
        window.Telegram.WebApp.offEvent('popupClosed', handleUnload);
        window.Telegram.WebApp.offEvent('web_app_close', handleUnload);
        window.Telegram.WebApp.offEvent('web_app_minimize', handleUnload);
      };
    }, [tapingBalance, userBalance,energy,maxEnergy, rechargeSpeed, telegramId]);

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
        if (isLoaded &&  energy !== maxEnergy) {
          console.log(userBalance)
          console.log(tapingBalance)
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
    }, [location, isLoaded]);


    // Save balance on route change
    useEffect(() => {
      const saveBalanceOnRouteChange = async () => {
          try {
            await saveData();
            console.log('Balance saved successfully');
          } catch (error) {
            console.error('Error saving balance:', error);
          }
      };

      saveBalanceOnRouteChange();

      return () => {
        saveBalanceOnRouteChange();
      };
    }, [location]);
    const saveEnergy = async () => {
      try {
        const energyData = JSON.stringify({ newEnergy: energyRef.current });

        await fetch(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: energyData,
          keepalive: true
        });

        console.log(`Energy saved: ${energyData}`);
      } catch (error) {
        console.error('Error saving energy:', error);
      }
    };
    const saveData = async () => {
      if (userBalance !== 0 || tapingBalance !== 0) {
        try {
          // Отримання даних для кожного запиту
          const energyData = JSON.stringify({ newEnergy: energyRef.current });
          const tapingBalanceData = JSON.stringify({ taping_balance: tapingBalanceRef.current });
          const totalBalanceData = JSON.stringify({ total_balance: balanceRef.current });

          console.log(`Saved energy - ${energyData}`)
          // Надсилання PUT запитів
          await Promise.all([
            fetch(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: energyData,
              keepalive: true
            }),
            fetch(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: tapingBalanceData,
              keepalive: true
            }),
            fetch(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: totalBalanceData,
              keepalive: true
            })
          ]);

          console.log(balanceRef.current);
          console.log("saveData() successfully " + userBalance + " taping balance while saveData() " + tapingBalanceRef.current);
        } catch (error) {
          console.error('Error saving data:', error);
        }
      }
    };

    useEffect(() => {
      console.log("userBalance -" + userBalance);
      console.log("userTapingBalance -" + tapingBalance);
      // Збереження балансу та енергії в локальне сховище при їх зміні
      localStorage.setItem('userBalance', userBalance !== null ? userBalance : 0);
      localStorage.setItem('userTapingBalance', tapingBalance !== null ? tapingBalance : 0);
      localStorage.setItem('energy', energy !== null ? energy : 0);
    }, [tapingBalance, energy]);



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
    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
    const updateBalance = debounce((newBalance) => {
      ws.send(JSON.stringify({
        type: 'updateBalance',
        telegram_id: telegramId,
        newBalance: newBalance,
        newEnergy: energyRef.current
      }));
      updateUserLeague(telegramId);
    }, 500);
    const calculatePointsEarned = () => {
      const pointsEarned = tapingGuruActiveRef.current ? multitapLevel * 5 : multitapLevel;
      return pointsEarned;
    };
    const handleTap = useCallback((clientX, clientY) => {
      if (energyRef.current > 0) {
        if (multitapLevel > energyRef.current) {
          console.log('Not enough energy to multitap');
          return;
        }
        const pointsEarned = calculatePointsEarned();
        if (!tapingGuruActive) {
          setEnergy((prevEnergy) => {
            const newEnergy = prevEnergy - pointsEarned;
            return newEnergy >= 0 ? newEnergy : 0; // Ensure energy doesn't go negative
          });
        }
        animatePlusOne(clientX, clientY, `+${pointsEarned}`, () => {
          const newBalance = balanceRef.current + pointsEarned;
          const newTapingBalance = tapingBalanceRef.current + pointsEarned;
          balanceRef.current = newBalance;
          tapingBalanceRef.current = newTapingBalance;
          console.log(newBalance)
          console.log(balanceRef.current)
          setUserBalance(newBalance);
          setTapingBalance(newTapingBalance);
          if (newBalance - userBalance >= 100) {
            updateBalance(newBalance);
          }
        });
          if (window.Telegram.WebApp.impactOccurred)
          window.Telegram.WebApp.impactOccurred('light'); // Or other styles like 'light', 'heavy', 'rigid', 'soft'

      } else {
        console.log('Not enough energy to tap');
      }
    }, [calculatePointsEarned, multitapLevel, tapingGuruActive, userBalance, updateBalance]);
    const handleEvent = useCallback((event) => {
      if (!isLoaded) {
        console.log('Data not loaded yet');
        return;
      }

      if (event.type === 'pointerdown') {
        handleTap(event.clientX, event.clientY);
      }
    }, [handleTap]);

    const animatePlusOne = (startX, startY, text, callback) => {
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
        if (callback) {
          callback();
        }
      }, 500);
    };

    const energyBarWidth = (energy / maxEnergy) * 100 + '%';

    const getLeagueImage = (league) => {
      const leagueData = leagues.find(l => l.name.toUpperCase() === league.toUpperCase());
      return leagueData ? leagueData.img : './ranks/wood.png';
    };

    const handleGoldButtonClick = () => {
      navigate('/league-progress');
    };

    if (!isLoaded) {
      return <LoadingScreen />;
    }

    const handleCloseModal = () => {
      setShowBoostModal(false);
      setShowBoostModalLocal(false)
    };
    const handleClaimPoints = async () => {
      if (autoTapData.accumulatedPoints > 0) {
        const updatedBalance = userBalance + autoTapData.accumulatedPoints;
        const updatedTapingBalance = tapingBalance + autoTapData.accumulatedPoints;
        setUserBalance(updatedBalance);
        setTapingBalance(updatedTapingBalance);
        // Відправка оновленого балансу на сервер
        await axios.put(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
          taping_balance: updatedTapingBalance
        });
        await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
          total_balance: updatedBalance
        });
        setAutoTapData((prevData) => ({
          ...prevData,
          accumulatedPoints: 0
        }));
        localStorage.setItem('autoTapData', JSON.stringify({
          ...autoTapData,
          accumulatedPoints: 0
        }));
        await axios.put(`${config.apiBaseUrl}/reset-accumulated-points/${telegramId}`);

        setShowBoostModal(false);
        setShowBoostModalLocal(false)
      } else {
        setMessage('No points to claim.');
      }
    };

    const closeMessage = () => {
      setMessage(null);
    };
    const formatBalance = (balance) => {
      if (balance >= 1_000_000_000) {
        return (balance / 1_000_000_000).toFixed(1) + ' B';
      } else if (balance >= 1_000_000) {
        return (balance / 1_000_000).toFixed(1) + ' M';
      } else {
        return balance.toLocaleString(); // To add commas for thousands
      }
    };
    return (
        <div className="Tap" >
          <div className="Tap-content">

            <div className="balance-display">
              <img src="/coin.png" alt="Coin" className="coin-icon" />
              <span className="balance-amount blue-style">{formatBalance(userBalance)}</span>
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
                onPointerDown={handleEvent}
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
          {message && <CompletionMessage message={message} onClose={closeMessage} />}
          {showBoostModal && (
              <BoostModal
                  boost={{ name: 'AUTO TAP', price: 100, description: 'Auto Tap boost', image: '/path/to/image.png' }}
                  onClose={handleCloseModal}
                  autoTapData={autoTapData}
                  handleClaimPoints={handleClaimPoints}
              />
          )}
        </div>
    );
  }

  export default Tap;
