import './Boost.css';
import React, { useState, useEffect } from 'react';
import './TextStyle.css';
import CompletionMessage from './ModelMessage';
import axios from 'axios';
import config from '../config';

const Boost = ({ telegramId, purchasedBoosts, setPurchasedBoosts }) => {
    const [message, setMessage] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [dailyBoosts, setDailyBoosts] = useState({
        "TAPPING GURU": 3,
        "FULL TANK": 3,
    });
    const [boosts, setBoosts] = useState([]);

    // Загрузка бустов с сервера
    useEffect(() => {
        const fetchBoosts = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/boosts`);
                setBoosts(response.data);
            } catch (error) {
                console.error('Error fetching boosts:', error);
            }
        };

        fetchBoosts();
    }, []);

    useEffect(() => {
        const resetDailyBoosts = () => {
            setDailyBoosts({
                "TAPPING GURU": 3,
                "FULL TANK": 3,
            });
        };

        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const timeUntilMidnight = midnight - now;

        const timeoutId = setTimeout(() => {
            resetDailyBoosts();
            setInterval(resetDailyBoosts, 24 * 60 * 60 * 1000); // reset daily boosts every 24 hours
        }, timeUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const fetchUserBalance = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/user-balance/${telegramId}`);
                setUserBalance(response.data.balance);
            } catch (error) {
                console.error('Error fetching user balance:', error);
            }
        };

        fetchUserBalance();
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

    const handlePurchase = async (boostName, price) => {
        try {
            const response = await axios.post(`${config.apiBaseUrl}/purchase-boost`, {
                telegram_id: telegramId,
                boost_name: boostName,
                price: price
            });
            const success = response.data.success;

            if (success) {
                setPurchasedBoosts((prevBoosts) => ({
                    ...prevBoosts,
                    [boostName]: true,
                }));
                setUserBalance(response.data.newBalance);
                setMessage(`${boostName} purchased successfully!`);
            } else {
                setMessage('Not enough points for this purchase.');
            }
        } catch (error) {
            console.error('Error purchasing boost:', error);
            setMessage('Failed to purchase boost.');
        }
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
                <img src='/16.png' className='lightning f-tab right' alt="Lightning Right"/>
                <img src='/17.png' className='lightning f-tab left' alt="Lightning Left"/>
            </div>
            <header className="header">
                <div className="balance-display-task">
                    <img src="/coin.png" alt="Coin" className="coin-icon"/>
                    <span className="balance-amount blue-style">{userBalance}</span>
                </div>
            </header>
            <div className="dayli-boost-text gold-style">YOUR DAILY BOOSTERS:</div>
            <div className="daily-boosts">
                <DailyBoostItem text="TAPPING GURU" reward="3" image='/boost/fire.b.png'/>
                <DailyBoostItem text="FULL TANK" reward="3" image="/boost/power.png"/>
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
            {message && <CompletionMessage message={message} onClose={closeMessage}/>}
        </div>
    );
};

export default Boost;
