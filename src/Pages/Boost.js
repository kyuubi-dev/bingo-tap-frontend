import React, { useState, useEffect, useRef } from 'react';
import './Boost.css';
import './TextStyle.css';
import CompletionMessage from './ModelMessage';
import boostsData from './boostData.js';  // Імпортуємо дані бустів
import boostLevels from './boostLevel.js';  // Імпортуємо рівні бустів
import ReconnectingWebSocket from 'reconnecting-websocket';
import config from "../config";
const Boost = ({ telegramId, purchasedBoosts, setPurchasedBoosts }) => {
    const [message, setMessage] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [dailyBoosts, setDailyBoosts] = useState({
        "TAPPING GURU": 3,
        "FULL TANK": 3,
    });
    const [boosts, setBoosts] = useState(boostsData);  // Встановлюємо початковий список бустів з файлу
    const ws = useRef(null);

    // Підключення до WebSocket
    useEffect(() => {
        const url = `${config.wsBaseUrl}`; // Вставте правильну URL-адресу WebSocket
        ws.current = new ReconnectingWebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
            // Запитуємо дані користувача при підключенні
            ws.current.send(JSON.stringify({
                type: 'requestUserData',
                telegram_id: telegramId
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);

            if (data.type === 'userData' ) {
                setUserBalance(data.balance);
                setBoosts(boosts.map(boost => ({
                    ...boost,
                    level: data.boosts[boost.name]?.level || boost.level,
                    price: data.boosts[boost.name]?.price || boost.price
                })));
            } else if (data.type === 'balanceUpdate' && data.telegram_id === telegramId) {
                setUserBalance(data.newBalance);
            } else if (data.type === 'boostUpdate' && data.telegram_id === telegramId) {
                setBoosts(boosts.map(boost => (
                    boost.name === data.boost_name
                        ? { ...boost, level: data.newLevel, price: data.newPrice }
                        : boost
                )));
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

    const handlePurchase = (boostName, price) => {
        setMessage(`Purchasing ${boostName}...`);

        // Відправляємо запит на покупку буста через WebSocket
        ws.current.send(JSON.stringify({
            type: 'purchaseBoost',
            telegram_id: telegramId,
            boost_name: boostName,
            price: price
        }));
    };

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

    const BoostItem = ({ text, price, image, level }) => (
        <div className="boost-item" onClick={() => handlePurchase(text, price)}>
            <img src={image} alt="icon" className="boost-icon" />
            <div className="boost-text blue-style">{text}</div>
            <div className="boost-price">
                <img src="/coin.png" alt="Price-Coin" className="price-icon" />
                <span className="gold-style">{price}</span>
            </div>
            <div className="boost-level blue-style">
                Level {level}
            </div>
        </div>
    );

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
            </div>
            {message && <CompletionMessage message={message} onClose={closeMessage} />}
        </div>
    );
};

export default Boost;
