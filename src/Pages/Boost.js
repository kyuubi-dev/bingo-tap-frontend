    import React, { useState, useEffect, useRef } from 'react';
    import './Boost.css';
    import './TextStyle.css';
    import CompletionMessage from './ModelMessage';
    import boostsData from './boostData.js';  // Import boost data
    import boostLevels from './boostLevel.js';
    import config from "../config";
    import LoadingScreen from "./LoadingScreen";
    import BoostModal from './boostModal';
    import axios from "axios";
    import {useLocation, useNavigate} from "react-router-dom";  // Import the modal component

    const Boost = ({ telegramId,ws }) => {
        const [message, setMessage] = useState(null);
        const location = useLocation();
        const navigate = useNavigate();
        const initialBalance = location.state?.userBalance || 0;
        const [userBalance, setUserBalance] = useState(initialBalance);
        const [dailyBoosts, setDailyBoosts] = useState({
            "tapingGuru": { charges: 0, lastUpdate: Date.now() },
            "fullTank": { charges: 0, lastUpdate: Date.now() },
        });
        const [autoTapData, setAutoTapData] = useState({
            active: false,
            accumulatedPoints: 0,
            timeLeft: 0,
            lastUpdate: null
        });

        const [boosts, setBoosts] = useState(boostsData);  // Set initial boost list from file
        const [isLoaded, setIsLoaded] = useState(false);
        const [tapingGuruActive, setTapingGuruActive] = useState(false);
        const [selectedBoost, setSelectedBoost] = useState(null);
        const [energy, setEnergy]=useState(0);
        
        useEffect(() => {
            setIsLoaded(false);
            const initializeUserData = async () => {
                const cachedUserBalance = localStorage.getItem('userBalance');
                if (cachedUserBalance) {
                    setUserBalance(parseInt(cachedUserBalance, 10));
                }

                try {
                    await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                        balance: cachedUserBalance
                    });

                    // Після збереження даних відкриваємо WebSocket
                    requestData();
                    setIsLoaded(true);
                    checkAutoTapStatus();

                } catch (error) {
                    console.error("Error saving balance:", error);
                }
            };

            const checkAutoTapStatus = () => {
                const storedAutoTapData = JSON.parse(localStorage.getItem('autoTapData'));
                if (storedAutoTapData && storedAutoTapData.accumulatedPoints > 0 && !storedAutoTapData.active) {
                    const updatedBalance = userBalance + storedAutoTapData.accumulatedPoints;
                    setUserBalance(updatedBalance);
                    setAutoTapData(prevData => ({
                        ...prevData,
                        accumulatedPoints: 0
                    }));
                    setMessage(`Claimed ${storedAutoTapData.accumulatedPoints} points!`);
                    try {
                        axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                            balance: updatedBalance
                        });
                        localStorage.setItem('autoTapData', JSON.stringify({
                            ...autoTapData,
                            accumulatedPoints: 0
                        }));
                    } catch (error) {
                        console.error('Ошибка при обновлении баланса на сервере:', error);
                    }
                }
            };

            initializeUserData();
        }, []);

        const requestData = () => {
                ws.send(JSON.stringify({
                    type: 'requestUserData',
                    telegram_id: telegramId
                }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);

                if (data.type === 'userData') {
                    setUserBalance(data.balance);
                    setDailyBoosts(data.dailyBoosts);
                    setBoosts(boosts.map(boost => {
                        if (boost.name === 'MULTITAP') {
                            return { ...boost, level: data.multiTapLevel } ;
                        } else if (boost.name === 'ENERGY LIMIT') {
                            return { ...boost, level: data.energyLimitLevel };
                        } else if (boost.name === 'RECHARGE SPEED') {
                            return { ...boost, level: data.rechargingSpeed };
                        }
                        return boost;
                    }));
                    setEnergy(data.energy);
                    // Додаємо перевірку та оновлення стану для autoTapData
                    if (data.autoTap) {
                        setAutoTapData({
                            active: data.autoTap.active,
                            accumulatedPoints: data.autoTap.accumulatedPoints,
                            timeLeft: data.autoTap.timeLeft,
                            lastUpdate: data.autoTap.lastUpdate
                        });
                    } else {
                        setAutoTapData(autoTapData); // Встановлюємо стан за замовчуванням, якщо дані не отримані
                    }
                } else if (data.type === 'updateBalance' && data.telegram_id === telegramId) {
                    setUserBalance(data.newBalance);
                } else if (data.type === 'boostUpdate' && data.telegram_id === telegramId) {
                    setBoosts(boosts.map(boost => {
                        if (boost.name === 'MULTITAP') {
                            return { ...boost, level: data.boostLevels.multiTapLevel };
                        } else if (boost.name === 'ENERGY LIMIT') {
                            return { ...boost, level: data.boostLevels.energyLimitLevel };
                        } else if (boost.name === 'RECHARGE SPEED') {
                            return { ...boost, level: data.boostLevels.rechargingSpeed };
                        }
                        return boost;
                    }));
                    setUserBalance(data.balance);
                } else if(data.type === 'boostActivated'){
                    if (data.telegram_id === telegramId) {
                        setDailyBoosts(prevBoosts => ({
                            ...prevBoosts,
                            [data.boost]: {
                                ...prevBoosts[data.boost],
                                charges: data.chargesLeft
                            }
                        }));
                    }
                } else if (data.type === 'energyMaximized') {
                    setEnergy(data.energy);
                } else if (data.type === 'error') {
                    setMessage(data.message);
                }
            };

        useEffect(() => {
            const timer = setInterval(() => {
                const now = Date.now();
                setDailyBoosts(prevBoosts => {
                    const newBoosts = { ...prevBoosts };
                    for (let boostName in newBoosts) {
                        const elapsedTime = now - new Date(newBoosts[boostName].lastUpdate).getTime();
                        const remainingTime = Math.max(8 * 60 * 60 * 1000 - elapsedTime);
                        newBoosts[boostName].remainingTime = remainingTime;
                    }
                    return newBoosts;
                });
            }, 1000);  // Update every second

            return () => clearInterval(timer);
        }, []);

        const handleActivateAutoTap = () => {
            const autoTapPrice = 200000;

            if (userBalance >= autoTapPrice || autoTapData.active==false) {
                const now = Date.now();
                const threeHoursLater = now + 3 * 60 * 60 * 1000; // 3 години

                const updatedBalance = userBalance - autoTapPrice;

                ws.send(JSON.stringify({
                    type: 'purchaseBoost',
                    telegram_id: telegramId,
                    boostType: `AUTO TAP`,
                    price: autoTapPrice,
                }));
                setUserBalance(updatedBalance);
                sendAutoTapActivation();
                ws.send(JSON.stringify({
                    type: 'requestUserData',
                    telegram_id: telegramId
                }));
                setMessage('AUTO TAP purchased! Points will be added automatically for the next 3 hours.');
            } else {
                setMessage('Insufficient balance for purchasing AUTO TAP.');
            }
        };

        const handleClaimPoints = async () => {
            if (autoTapData.accumulatedPoints > 0) {
                const updatedBalance = userBalance + autoTapData.accumulatedPoints;
                setUserBalance(updatedBalance);
                // Відправка оновленого балансу на сервер
                await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                    balance: updatedBalance
                });
                setAutoTapData((prevData) => ({
                    ...prevData,
                    accumulatedPoints: 0
                }));
                localStorage.setItem('autoTapData', JSON.stringify({
                    ...autoTapData,
                    accumulatedPoints: 0
                }));
                setMessage(`Claimed ${autoTapData.accumulatedPoints} points!`);
            } else {
                setMessage('No points to claim.');
            }
        };

        const handleDailyBoostClick = (boost) => {
            setSelectedBoost(boost);
        };

        const handleBoostClick = (boost) => {
            setSelectedBoost(boost);
        };

        const sendAutoTapActivation = () => {
            ws.send(JSON.stringify({
                type: 'activateAutoTap',
                telegram_id: telegramId
            }));
            console.log(`autoTapActivation - ${autoTapData}`);
        };


        const handleBuyBoost = (boost) => {
            // Логіка для покупки буста
            if (boost.name === 'AUTO TAP') {
                handleActivateAutoTap();
                setSelectedBoost(null);  // Закриття модального вікна після покупки
                return; // Виходимо, оскільки для AUTO TAP ми вже обробили покупку
            }
            if (!boost || boost.level === undefined) {
                setMessage('Invalid boost data.');
                return;
            }

            const nextLevel = boost.level + 1;
            const boostData = boostLevels[boost.name].find(level => level.level === nextLevel);

            if (!boostData) {
                setMessage(`Max level reached for ${boost.name}.`);
                return;
            }

            const { price } = boostData;

            if (userBalance < price) {
                setMessage('Insufficient balance.');
                return;
            }

            setUserBalance((prevBalance) => prevBalance - price);
            setIsLoaded(false);
            try {
                ws.send(JSON.stringify({
                    type: 'purchaseBoost',
                    telegram_id: telegramId,
                    boostType: boost.name,
                    price: price,
                }));

                ws.send(JSON.stringify({
                    type: 'requestUserData',
                    telegram_id: telegramId
                }));
            } catch (error) {
                console.error("Error purchasing boost:", error);
                setIsLoaded(true);
                setMessage('Error purchasing boost. Please try again.');
            }
            setSelectedBoost(null);  // Закриття модального вікна після покупки
        };

        const handleModalClose = (event) => {
            setSelectedBoost(null);
        };

        const handleActivateTapingGuru = () => {
            const tapingGuruBoost = dailyBoosts["tapingGuru"];

            if (!tapingGuruBoost) {
                setMessage('Taping Guru boost data is unavailable.');
                return;
            }

            if (tapingGuruBoost.charges > 0 && !tapingGuruActive) {
                setDailyBoosts((prevBoosts) => ({
                    ...prevBoosts,
                    "tapingGuru": {
                        charges: prevBoosts["tapingGuru"].charges - 1,
                        lastUpdate: prevBoosts["tapingGuru"].lastUpdate
                    }
                }));
                ws.send(JSON.stringify({
                    type: 'activateBoost',
                    telegram_id: telegramId,
                    boost: "tapingGuru"
                }));
                setTapingGuruActive(true);

                navigate('/', { state: { tapingGuruActive: true } });

                setTimeout(() => {
                    setTapingGuruActive(false);
                }, 20000); // 20 seconds
            } else if (tapingGuruActive) {
                setMessage('Taping Guru is already active.');
            } else {
                setMessage('No Taping Guru boosts left.');
            }
        };

        const handleActivateFullTank = async () => {
            if (dailyBoosts["fullTank"].charges > 0) {
                try {
                    // Оновлюємо стан перед відправкою запитів
                    setTapingGuruActive(true);
                    setDailyBoosts((prevBoosts) => ({
                        ...prevBoosts,
                        "fullTank": {
                            charges: prevBoosts["fullTank"].charges - 1,
                            lastUpdate: prevBoosts["fullTank"].lastUpdate
                        }
                    }));

                    // Відправка першого запиту
                        ws.send(JSON.stringify({
                            type: 'activateBoost',
                            telegram_id: telegramId,
                            boost: "fullTank"
                        }))

                    console.log('activateBoost request sent successfully');

                    const response = await axios.put(`${config.apiBaseUrl}/maximize-energy/${telegramId}`);
                    return response.data;

                    navigate('/');

                } catch (error) {
                    // Відновлюємо стан у разі помилки
                    console.error('Error sending request:', error);
                    setTapingGuruActive(false);
                    setDailyBoosts((prevBoosts) => ({
                        ...prevBoosts,
                        "fullTank": {
                            charges: prevBoosts["fullTank"].charges + 1,
                            lastUpdate: prevBoosts["fullTank"].lastUpdate
                        }
                    }));
                    setMessage('Error activating Full Tank boost. Please try again.');
                }
            } else {
                setMessage('No Full Tank boosts left.');
            }
        };


        if (!isLoaded) {
            return <LoadingScreen />;
        }

        const closeMessage = () => {
            setMessage(null);
        };


        const formatRemainingTime = (milliseconds) => {
            const hours = String(Math.floor((milliseconds / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const minutes = String(Math.floor((milliseconds / (1000 * 60)) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((milliseconds / 1000) % 60)).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };

        if (!isLoaded) {
            return <LoadingScreen />;
        }

        const DailyBoostItem = ({ text,txt, reward, image, description }) => {
            const isInactive = dailyBoosts[text]?.charges === 0;
            return (
                <div className={`daily-boost-item ${isInactive ? 'inactive' : ''}`} onClick={() => { if (!isInactive) {handleDailyBoostClick({
                    price: "FREE",
                    name: txt,
                    description: description,
                    remaining: dailyBoosts[text]?.charges ?? 0,
                    image
                })}}}>
                    <img src={image} alt="icon" className="boost-icon"/>
                    <div className={`d-boost-text ${isInactive ? 'grey-text' : 'blue-style'}`}>{txt}</div>
                    {dailyBoosts[text].charges === 0 ? (
                        <div className="boost-timer">{formatRemainingTime(dailyBoosts[text].remainingTime)}</div>
                    ) : (<div className="daily-boost-h">
                        <span className="gold-style">{dailyBoosts[text]?.charges ?? 0}/{reward}</span>
                    </div>)}

                </div>
            );
        }
        const BoostItem = ({text, price, image, level, description}) => {
            const isTapBot = text === 'AUTO TAP';
            const nextLevel = level + 1;
            const nextLevelData = boostLevels[text] ? boostLevels[text].find(lvl => lvl.level === nextLevel) : null;

            const boost = {
                name: text,
                price: nextLevelData ? nextLevelData.price : 'MAX LVL',
                image,
                level,
                description
            };
            return (
                <div className="boost-item" onClick={() => handleBoostClick(boost)}>
                    <img src={image} alt="icon" className="boost-icon" />
                    {isTapBot && autoTapData.active ? (
                        <div className="boost-text red-style">{text}</div>
                    ) : (
                        <>
                            <div className="boost-text blue-style">{text}</div>
                            <div className="boost-price">
                                <img src="/coin.png" alt="Price-Coin" className="price-icon"/>
                                <span
                                    className="gold-style">{isTapBot ? price : nextLevelData?.price || 'MAX LVL'}</span>
                            </div>
                            {!isTapBot && <div className="boost-level blue-style">Level {level}</div>}

                        </>
                    )}
                </div>
            );
        };

        return (
            <div className='Boost'>
                <div className='lightnings f-tab'>
                    <img src='/16.png' className='lightning f-tab right' alt="Lightning Right" />
                    <img src='/17.png' className='lightning f-tab left' alt="Lightning Left" />
                </div>
                <header className="header">
                    <div className="balance-display-task">
                        <img src="/coin.png" alt="Coin" className="coin-icon" />
                        <span className="balance-amount blue-style">{userBalance}</span>
                    </div>
                </header>
                <div className="dayli-boost-text gold-style">YOUR DAILY BOOSTERS:</div>
                <div className="daily-boosts">
                    <DailyBoostItem text="tapingGuru" txt="TAPING GURU" reward="3" image='/boost/fire.b.png' description="+5 points per click for 1 min" />
                    <DailyBoostItem text="fullTank" txt="FULL TANK" reward="3" image='/boost/power.png'  description="Set full for yours energy"/>
                </div>
                <div className="boosters-text gold-style">BOOSTERS:</div>
                <div className="boosts">
                    {boosts.map(boost => (
                        <BoostItem
                            key={boost.boost_id}
                            text={boost.name}
                            price={boost.price}
                            image={`/boost/${boost.image}.png`}
                            level={boost.level}
                            description={boost.description}
                        />
                    ))}
                    <BoostItem
                        text="AUTO TAP"
                        price={200000}
                        image='/boost/click.png'
                        description="Auto click by 3 hours"
                    />
                </div>
                {message && <CompletionMessage message={message} onClose={closeMessage} />}
                {selectedBoost && <BoostModal boost={selectedBoost} onClose={handleModalClose} onBuy={handleBuyBoost} onActivateTG={handleActivateTapingGuru} onActiveFT={handleActivateFullTank} autoTapData={autoTapData} handleClaimPoints={handleClaimPoints} telegram_id={telegramId} ws={ws}/>}
            </div>
        );
    };

    export default Boost;
