import './Boost.css';
import React, { useState } from 'react';
import './TextStyle.css';

const Boost = ({ userPoints, setUserPoints, purchasedBoosts, setPurchasedBoosts }) => {

    const handlePurchase = (boostName, price) => {
        if (userPoints >= price) {
            setUserPoints(userPoints - price);
            setPurchasedBoosts((prevBoosts) => ({
                ...prevBoosts,
                [boostName]: true,
            }));
            alert(`${boostName} purchased successfully!`);
        } else {
            alert('Not enough points for this purchase.');
        }
    };

    const DailyBoostItem = ({ text, reward, image }) => (
        <div className="daily-boost-item">
            <img src={image} alt="icon" className="boost-icon" />
            <div className="d-boost-text blue-style">{text}</div>
            <div className="daily-boost-h">
                <span className="gold-style">{reward}/3</span>
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
            <header className="header">
                <div className="balance-display-task">
                    <img src="/coin.png" alt="Coin" className="coin-icon" />
                    <span className="balance-amount blue-style">{userPoints}</span>
                </div>
            </header>
            <div className="dayli-boost-text gold-style">YOUR DAILY BOOSTERS:</div>
            <div className="daily-boosts">
                <DailyBoostItem text="TAPPING GURU" reward="3" image='/boost/fire.b.png' />
                <DailyBoostItem text="FULL TANK" reward="3" image="/boost/power.png" />
            </div>
            <div className="boosters-text gold-style">BOOSTERS:</div>
            <div className="boosts">
                <BoostItem text="Taping Guru" price={50000} image='/boost/dow.png' level="3" />
                <BoostItem text="Energy Limit" price={50000} image="/boost/fire.p.png" level="1" />
                <BoostItem text="Recharge Speed" price={50000} image="/boost/power.png" level="1" />
                <BoostItem text="Auto Tap" price={50000} image="/boost/click.png" level="1" />
            </div>
        </div>
    );
};

export default Boost;
