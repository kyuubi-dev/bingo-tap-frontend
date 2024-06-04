import './Boost.css';
import React from 'react';


const Boost = () => {
    const DailyBoostItem = ({ text, reward, image}) => (
        <div className="daily-boost-item">
          <img src={image} alt="icon" className="boost-icon" />
          <div className="task-text blue-style" >{text}</div>
          <div className="daily-boost-h">
            <span className='gold-style'>{reward}/3</span>
          </div>
        </div>
      );
      const BoostItem = ({ text, price, image,level}) => (
        <div className="boost-item">
          <img src={image} alt="icon" className="boost-icon" />
          <div className="boost-text blue-style">{text}</div>
          <div className="boost-price">
            <img src="/coin.png" alt="Price-Coin" className="price-icon" />
            <span className='gold-style'>{price}</span>
          </div>
          <div className='boost-level blue-style'>
            Level {level}
          </div>
        </div>
      );
  return(
    <h1 className='Boost'>
        <div className='bg-image' />
        <header className="team-header">
        <div className="balance-display-task">
          <img src="/coin.png" alt="Coin" className="coin-icon" />
          <span className="balance-amount">10 000</span>
        </div>
       
      </header>
      <div className="dayli-boost-text gold-style">YOURE DAILY BOOSTERS:</div>
      <div className="daily-boosts">
            <DailyBoostItem text="TAPING GURU" reward="3" image='/boost/fire.b.png' />
            <DailyBoostItem text="FULL TANK" reward="3"image="/boost/power.png" />
          </div>
          <div className="dayli-boost-text gold-style">BOOSTERS:</div>
          <div className="boosts">
            <BoostItem text="MULTITAP" price="50 000" image='/boost/dow.png' level="1"/>
            <BoostItem text="ENERGY LIMIT" price="50 000" image="/boost/fire.p.png" level="1"/>
            <BoostItem text="RECHARGE SPEED" price="50 000" image="/boost/power.png" level="1"/>
            <BoostItem text="AUTO TAP" price="50 000" image="/boost/click.png" level="1"/>
          </div>
    </h1>
  );
}
export default Boost;