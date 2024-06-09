import './Boost.css';
import React, { useState, useEffect } from 'react';
import './TextStyle.css';
import CompletionMessage from './ModelMessage';

const Boost = ({ userPoints, setUserPoints, purchasedBoosts, setPurchasedBoosts }) => {
    const [message, setMessage] = useState(null);
    const [dailyBoosts, setDailyBoosts] = useState({
        "TAPPING GURU": 3,
        "FULL TANK": 3,
    });

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
        if (userPoints >= price) {
            setUserPoints(userPoints - price);
            setPurchasedBoosts((prevBoosts) => ({
                ...prevBoosts,
                [boostName]: true,
            }));
            setMessage(`${boostName} purchased successfully!`);
        } else {
            setMessage('Not enough points for this purchase.');
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
                    <span className="balance-amount blue-style">{userPoints}</span>
                </div>
            </header>
            <div className="dayli-boost-text gold-style">YOUR DAILY BOOSTERS:</div>
            <div className="daily-boosts">
                <DailyBoostItem text="TAPPING GURU" reward="3" image='/boost/fire.b.png'/>
                <DailyBoostItem text="FULL TANK" reward="3" image="/boost/power.png"/>
            </div>
            <div className="boosters-text gold-style">BOOSTERS:</div>
            <div className="boosts">
                <BoostItem text="MULTITAP" price={50000} image='/boost/dow.png' level="3"/>
                <BoostItem text="Energy Limit" price={50000} image="/boost/fire.p.png" level="1"/>
                <BoostItem text="Recharge Speed" price={50000} image="/boost/power.png" level="1"/>
                <BoostItem text="Auto Tap" price={50000} image="/boost/click.png" level="1"/>
            </div>
            {message && <CompletionMessage message={message} onClose={closeMessage}/>}
        </div>
    );
};

export default Boost;
