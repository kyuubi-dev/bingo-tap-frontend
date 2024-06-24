import React, { useState, useEffect, useRef } from 'react';
import './Boost.css';
import './TextStyle.css';
import CompletionMessage from './ModelMessage';
import boostsData from './boostData.js';  // Import boost data
import boostLevels from './boostLevel.js';
import ReconnectingWebSocket from 'reconnecting-websocket';
import config from "../config";
import LoadingScreen from "./LoadingScreen";

const Boost = ({ telegramId, purchasedBoosts, setPurchasedBoosts }) => {
    const [message, setMessage] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [dailyBoosts, setDailyBoosts] = useState({
        "TAPPING GURU": 3,
        "FULL TANK": 3,
    });
    const [boosts, setBoosts] = useState(boostsData);  // Set initial boost list from file
    const [isLoaded, setIsLoaded] = useState(false);
    const [tapBotActive, setTapBotActive] = useState(false);
    const [tapBotPoints, setTapBotPoints] = useState(0);
    const [tapBotTimer, setTapBotTimer] = useState(0);
    const [lastTapBotTime, setLastTapBotTime] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        const initializeUserData = async () => {
            // Отримання даних користувача, які зберігаються локально
            const cachedUserBalance = localStorage.getItem('userBalance');

            if (cachedUserBalance) {
                setUserBalance(parseInt(cachedUserBalance));
            }

            setIsLoaded(true);
        };

        initializeUserData();
    }, []);


    // Connect to WebSocket
    useEffect(() => {
        const url = `${config.wsBaseUrl}`; // Insert the correct WebSocket URL
        ws.current = new ReconnectingWebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
            // Request user data upon connection
            ws.current.send(JSON.stringify({
                type: 'requestUserData',
                telegram_id: telegramId
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);

            if (data.type === 'userData') {
                setUserBalance(data.balance);
                setBoosts(boosts.map(boost => {
                    if (boost.name === 'MULTITAP') {
                        return { ...boost, level: data.multiTapLevel };
                    } else if (boost.name === 'Energy Limit') {
                        return { ...boost, level: data.energyLimitLevel };
                    } else if (boost.name === 'Recharge Speed') {
                        return { ...boost, level: data.rechargingSpeed };
                    }
                    return boost;
                }));
                setIsLoaded(true);
            } else if (data.type === 'balanceUpdate' && data.telegram_id === telegramId) {
                setUserBalance(data.newBalance);
            } else if (data.type === 'boostUpdate' && data.telegram_id === telegramId) {
                setBoosts(boosts.map(boost => {
                    if (boost.name === data.boostType) {
                        return { ...boost, level: data.newLevel };
                    }
                    return boost;
                }));
            } else if (data.type === 'error') {
                setMessage(data.message);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            ws.current.close();
        };
    }, [telegramId]);

    useEffect(() => {
        let interval;
        if (tapBotActive) {
            const storedTime = localStorage.getItem('tapBotTime');
            const storedPoints = localStorage.getItem('tapBotPoints');
            const storedLastTime = localStorage.getItem('lastTapBotTime');

            if (storedTime && storedPoints && storedLastTime) {
                const timeDifference = Math.floor((Date.now() - new Date(storedLastTime).getTime()) / 3600000);
                const newPoints = Math.min(timeDifference, 3) + parseInt(storedPoints, 10);
                setTapBotPoints(newPoints);
                setTapBotTimer(3 - newPoints);
            }

            interval = setInterval(() => {
                setTapBotPoints((prevPoints) => prevPoints + 1);
                setTapBotTimer((prevTimer) => prevTimer - 1);
                localStorage.setItem('tapBotTime', tapBotTimer);
                localStorage.setItem('tapBotPoints', tapBotPoints);
                localStorage.setItem('lastTapBotTime', new Date());
            }, 3600000); // 1 hour in milliseconds

            if (tapBotTimer <= 0) {
                clearInterval(interval);
                setTapBotActive(false);
                setUserBalance((prevBalance) => prevBalance + tapBotPoints);
                setTapBotPoints(0);
                setTapBotTimer(0);
                localStorage.removeItem('tapBotTime');
                localStorage.removeItem('tapBotPoints');
                localStorage.removeItem('lastTapBotTime');
            }
        }

        return () => clearInterval(interval);
    }, [tapBotActive, tapBotTimer]);

    const handleDailyBoostUse = (boostName) => {
        if (dailyBoosts[boostName] > 0) {
            setDailyBoosts((prevBoosts) => ({
                ...prevBoosts,
                [boostName]: prevBoosts[boostName] - 1,
            }));
            setMessage(`${boostName} boost used!`);
        } else {
            setMessage('No charges left for this boost.');
        }
    };

    const handlePurchase = (boostName, currentLevel) => {
        const nextLevel = currentLevel + 1;
        const boostData = boostLevels[boostName].find(level => level.level === nextLevel);

        if (!boostData) {
            setMessage(`Max level reached for ${boostName}.`);
            currentLevel = "MAX LEVEL"
            return;
        }

        const { price } = boostData;
        setMessage(`Purchasing ${boostName} level ${nextLevel}... Waiting for upgrading ${boostName}`);

        ws.current.send(JSON.stringify({
            type: 'purchaseBoost',
            telegram_id: telegramId,
            boostType: boostName,
            price: price,
            level: nextLevel
        }));
    };

    const handleTapBotPurchase = () => {
        const tapBotPrice = 200000;

        if (userBalance >= tapBotPrice) {
            setUserBalance((prevBalance) => prevBalance - tapBotPrice);
            setTapBotActive(true);
            setTapBotTimer(3); // 3 hours
            setLastTapBotTime(new Date());
            setMessage('AUTO TAP purchased! 1 point per hour will be added to your balance for the next 3 hours.');

            ws.current.send(JSON.stringify({
                type: 'purchaseBoost',
                telegram_id: 874423521,
                boostType: 'AUTO TAP',
                price: tapBotPrice
            }));

            localStorage.setItem('tapBotTime', 3);
            localStorage.setItem('tapBotPoints', 0);
            localStorage.setItem('lastTapBotTime', new Date());
        } else {
            setMessage('Insufficient balance for purchasing AUTO TAP.');
        }
    };

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    const closeMessage = () => {
        setMessage(null);
    };

    const DailyBoostItem = ({ text, reward, image }) => (
        <div className="daily-boost-item" onClick={() => handleDailyBoostUse(text)}>
            <img src={image} alt="icon" className="boost-icon" />
            <div className="d-boost-text blue-style">{text}</div>
            <div className="daily-boost-h">
                <span className="gold-style">{dailyBoosts[text]}/{reward}</span>
            </div>
        </div>
    );

    const BoostItem = ({ text, price, image, level }) => {
        const isTapBot = text === 'AUTO TAP';
        const nextLevel = level + 1;
        const nextLevelData = boostLevels[text] ? boostLevels[text].find(lvl => lvl.level === nextLevel) : null;

        return (
            <div className="boost-item" onClick={() => isTapBot ? handleTapBotPurchase() : handlePurchase(text, level)}>
                <img src={image} alt="icon" className="boost-icon" />
                {isTapBot && tapBotActive ? (
                    <div className="tap-bot-timer">
                        <span>Time remaining: {tapBotTimer} hours</span>
                        <span className="gold-style">{tapBotPoints} points accumulated</span>
                    </div>
                ) : (
                    <>
                        <div className="boost-text blue-style">{text}</div>
                        <div className="boost-price">
                            <img src="/coin.png" alt="Price-Coin" className="price-icon" />
                            <span className="gold-style">{isTapBot ? price : nextLevelData?.price || 'N/A'}</span>
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
                <DailyBoostItem text="TAPPING GURU" reward="3" image='/boost/fire.b.png' />
                <DailyBoostItem text="FULL TANK" reward="3" image='/boost/power.png' />
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
                    />
                ))}
                <BoostItem
                    text="AUTO TAP"
                    price={200000}
                    image='/boost/click.png'
                />
            </div>
            {message && <CompletionMessage message={message} onClose={closeMessage} />}
        </div>
    );
};

export default Boost;
