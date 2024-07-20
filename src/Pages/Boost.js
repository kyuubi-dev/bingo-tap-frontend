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
        lastUpdate: null,
        cycleEnded: true
    });
    const [energy, setEnergy] = useState(0);
    const [boosts, setBoosts] = useState(boostsData);  // Set initial boost list from file
    const [isLoaded, setIsLoaded] = useState(true);
    const [tapingGuruActive, setTapingGuruActive] = useState(false);
    const [selectedBoost, setSelectedBoost] = useState(null);
    const checkAutoTapStatus = () => {
        const storedAutoTapData = autoTapData;
        const now = Date.now();
        if (storedAutoTapData && storedAutoTapData.active) {
            const timeElapsed = now - storedAutoTapData.lastUpdate;

            if (timeElapsed >= storedAutoTapData.timeLeft) {
                // Auto Tap time has ended
                setAutoTapData(prevData => ({
                    ...prevData,
                    active: false,
                    accumulatedPoints: 0,
                    timeLeft: 0
                }));
                localStorage.setItem('autoTapData', JSON.stringify({
                    ...storedAutoTapData,
                    active: false,
                    accumulatedPoints: 0,
                    timeLeft: 0
                }));
                // Activate new AutoTap cycle
                sendAutoTapActivation();

                requestData();
            } else {
                // Update state with existing data
                setAutoTapData({
                    active: storedAutoTapData.active,
                    accumulatedPoints: storedAutoTapData.accumulatedPoints,
                    timeLeft: storedAutoTapData.timeLeft - timeElapsed,
                    lastUpdate: storedAutoTapData.lastUpdate
                });
                const remainingTime = timeElapsed;
                setTimeout(() => {
                    requestData();
                }, remainingTime);
            }
        }
    }
    useEffect(() => { setIsLoaded(false);

        const initializeUserData = async () => {
            const cachedUserBalance = localStorage.getItem('userBalance');
            const cachedTapingUserBalance = localStorage.getItem('userTapingBalance');
            const energy = localStorage.getItem('energy');
            console.log('Cached user balance:', cachedUserBalance);
            console.log('CachedTaping user balance:', cachedTapingUserBalance);
            if (cachedUserBalance !== null) {
                setUserBalance(Number(cachedUserBalance));
            } else {
                setUserBalance(0);
            }
            if (cachedUserBalance) {
                setUserBalance(cachedUserBalance);
            }

            try {
                await axios.put(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
                    newEnergy: parseInt(energy, 10)
                });
                await axios.put(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
                    taping_balance: parseInt(cachedTapingUserBalance, 10)
                });
                await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                    total_balance: parseInt(cachedUserBalance, 10)
                });

                // Після збереження даних відкриваємо WebSocket
                requestData();
                checkAutoTapStatus();
            } catch (error) {
                console.error("Error saving balance:", error);
            }
        };


        initializeUserData();
        },[telegramId]);



    const requestData = () => {

        return new Promise((resolve, reject) => {
            ws.send(JSON.stringify({
                type: 'requestUserData',
                telegram_id: telegramId
            }));

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);

                if (data.type === 'userData') {

                    if (data.userTotalBalance != null) {
                        console.log('Setting user balance:', data.userTotalBalance);
                        setUserBalance(data.userTotalBalance);
                    }
                    setDailyBoosts(data.dailyBoosts);
                    setBoosts(boosts.map(boost => {
                        if (boost.name === 'MULTITAP') {
                            return { ...boost, level: data.multiTapLevel };
                        } else if (boost.name === 'ENERGY LIMIT') {
                            return { ...boost, level: data.energyLimitLevel };
                        } else if (boost.name === 'RECHARGE SPEED') {
                            return { ...boost, level: data.rechargingSpeed };
                        }
                        return boost;
                    }));
                    setEnergy(data.energy);

                    if (data.autoTap) {
                        setAutoTapData({
                            active: data.autoTap.active,
                            accumulatedPoints: data.autoTap.accumulatedPoints,
                            timeLeft: data.autoTap.timeLeft,
                            lastUpdate: data.autoTap.lastUpdate,
                            cycleEnded: data.autoTap.cycleEnded
                        });
                    } else {
                        setAutoTapData(autoTapData);
                    }

                    setIsLoaded(true);
                    resolve();  // Оповіщуємо, що дані були успішно отримані
                } else if (data.type === 'boostUpdate') {
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
                    setUserBalance(data.userTotalBalance);
                    resolve();  // Оповіщуємо, що дані були успішно отримані
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
                    resolve();  // Оповіщуємо, що дані були успішно отримані
                } else if (data.type === 'energyMaximized') {
                    setEnergy(data.energy);
                    resolve();  // Оповіщуємо, що дані були успішно отримані
                } else if (data.type === 'error') {
                    setMessage(data.message);
                    reject(data.message);  // Оповіщуємо, що сталася помилка
                }
            };
        });
    };

    // Function to save auto tap data to the server
        const saveAutoTapData = async () => {
            try {
                await axios.put(`${config.apiBaseUrl}/save-auto-tap-data/${telegramId}`, autoTapData);
                console.log('AUTO TAP data saved successfully.');
            } catch (error) {
                console.error('Error saving AUTO TAP data:', error);
            }
        };


    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            setDailyBoosts(prevBoosts => {
                const newBoosts = { ...prevBoosts };
                for (let boostName in newBoosts) {
                    const elapsedTime = now - new Date(newBoosts[boostName].lastUpdate).getTime();
                    const remainingTime = Math.max(24 * 60 * 60 * 1000 - elapsedTime);
                    newBoosts[boostName].remainingTime = remainingTime;
                }
                return newBoosts;
            });
        }, 1000);  // Update every second

        return () => clearInterval(timer);
    }, []);

    const handleActivateAutoTap = async () => {
        const autoTapPrice = 200000;

        if (userBalance >= autoTapPrice && !autoTapData.active) {
            try {
                const response = await fetch(`${config.apiBaseUrl}/purchase-boost`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telegram_id: telegramId,
                        boostType: 'AUTO TAP',  // Type of the boost
                        price: autoTapPrice
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const updatedBalance = data.newBalance;

                    // Update user's balance
                    setUserBalance(updatedBalance);
                    localStorage.setItem('userBalance', updatedBalance);

                    // Activate AUTO TAP
                    const now = Date.now();
                    const duration = 3 * 60 * 60 * 1000; // 3 hours
                    setAutoTapData({
                        active: true,
                        accumulatedPoints: 0,
                        timeLeft: duration,
                        lastUpdate: now,
                        cycleEnded: false
                    });
                    localStorage.setItem('autoTapData', JSON.stringify({
                        active: true,
                        accumulatedPoints: 0,
                        timeLeft: duration,
                        lastUpdate: now,
                        cycleEnded: false
                    }));

                    // Notify server
                    sendAutoTapActivation();

                    setMessage('AUTO TAP purchased and activated! Points will be added automatically for the next 3 hours.');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error purchasing boost');
                }
            } catch (error) {
                console.error('Error purchasing AUTO TAP boost:', error);
                setMessage('Error purchasing AUTO TAP.');
            }
        } else if (autoTapData.active) {
            setMessage('AUTO TAP is already active.');
        } else {
            setMessage('Insufficient balance for purchasing AUTO TAP.');
        }
    };



    const handleClaimPoints = async () => {
        if (autoTapData.accumulatedPoints >= 0) {
            const updatedBalance = userBalance + autoTapData.accumulatedPoints;
            setUserBalance(updatedBalance);
            localStorage.setItem('userBalance', updatedBalance);

            setAutoTapData((prevData) => ({
                ...prevData,
                accumulatedPoints: 0
            }));
            localStorage.setItem('autoTapData', JSON.stringify({
                ...autoTapData,
                accumulatedPoints: 0
            }));
            await axios.put(`${config.apiBaseUrl}/reset-accumulated-points/${telegramId}`);

            setSelectedBoost(null);

            sendAutoTapActivation();
            requestData();
            checkAutoTapStatus();
            saveAutoTapData();

        } else {
            setMessage('No points to claim.');
        }
    };

    const handleDailyBoostClick = (boost) => {
        setSelectedBoost(boost);
    };

    const handleBoostClick = async (boost) => {
        try {
            // Виклик асинхронної функції для отримання даних та очікування завершення
            if (boost.name === 'AUTO TAP') {
                // Виклик асинхронної функції для отримання даних та очікування завершення
                await requestData();
            }
            // Після отримання та обробки даних оновлюємо стан
            setSelectedBoost(boost);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Обробка помилки
        }
    };

    const sendAutoTapActivation = async () => {
        ws.send(JSON.stringify({
            type: 'activateAutoTap',
            telegram_id: telegramId
        }));
        console.log(`autoTapActivation - ${autoTapData}`);
    };



    const handleBuyBoost = async (boost) => {

        if (boost.name === "AUTO TAP") {
            handleActivateAutoTap();
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

        const updatedBalance = userBalance - price;


        try {
            const response = await axios.post(`${config.apiBaseUrl}/purchase-boost`, {
                telegram_id: telegramId,
                boostType: boost.name,
                price: price
            });

            if (response.data.success) {
                setUserBalance(updatedBalance);
                localStorage.setItem('userBalance', updatedBalance);

                setMessage('Boost purchased successfully!');
                requestData()
            } else {
                setMessage(response.data.message || 'Error purchasing boost.');
            }
        } catch (error) {
            console.error('Error purchasing boost:', error);
            setMessage('Error purchasing boost. Please try again.');
        } finally {
        }

        setSelectedBoost(null);
    };


    const handleModalClose = () => {
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
                // Перенаправлення після успішного запиту
                navigate('/', { state: { tapingGuruActive: false } });

                return response.data;


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
                    <span className="gold-style boost-price">{dailyBoosts[text]?.charges ?? 0}/{reward}</span>
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
                    <div className={`boost-text ${autoTapData.timeLeft === 0 && autoTapData.accumulatedPoints === 0 ? 'gold-style' : 'red-style'}`}>{text}</div>
                ) : (
                    <>
                        <div className="boost-text blue-style">{text}</div>
                        <div className="boost-price">
                            <img src="/coin.png" alt="Price-Coin" className="price-icon"/>
                            <span
                                className="gold-style boost-price">{isTapBot ? formatBalance(price) : formatBalance(nextLevelData?.price) || 'MAX LVL'}</span>
                        </div>
                        {!isTapBot && <div className="boost-level blue-style">Level {level}</div>}

                    </>
                )}
            </div>
        );
    };

    const formatBalance = (balance) => {
        if (balance >= 1_000_000_000) {
            return (balance / 1_000_000_000).toFixed(3) + ' B';
        } else if (balance >= 1_000_000) {
            return (balance / 1_000_000).toFixed(3) + ' M';
        } else {
            return balance.toLocaleString(); // To add commas for thousands
        }
    };
    return (
        <div className='Boost'>
            <header className="header">
                <div className="balance-display-task">
                    <img src="/coin.png" alt="Coin" className="coin-icon" />
                    <span className="balance-amount blue-style">{formatBalance(userBalance)}</span>
                </div>
            </header>
            <div className="dayli-boost-text gold-style">YOUR DAILY BOOSTERS:</div>
            <div className="daily-boosts">
                <DailyBoostItem text="tapingGuru" txt="TAPING GURU" reward="3" image='/boost/fire.b.png' description="x5 points per click for 20 sec" />
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
                    description="Auto Tap Bot will mining coins  every 3 hours."
                />
            </div>
            {message && <CompletionMessage message={message} onClose={closeMessage} />}
            {selectedBoost &&
                <BoostModal
                    boost={selectedBoost}
                    onClose={handleModalClose}
                    onBuy={handleBuyBoost}
                    onActivateTG={handleActivateTapingGuru}
                    onActiveFT={handleActivateFullTank}
                    autoTapData={autoTapData}
                    handleClaimPoints={handleClaimPoints}
                    telegram_id={telegramId}
                    ws={ws}
                />}
            </div>
    );
};

export default Boost;
