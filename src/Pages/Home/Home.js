import React, { useState } from 'react';
import './Home.css';

function Home() {
  const [userBalance, setUserBalance] = useState(0);

  const handleMainButtonClick = () => {
    setUserBalance(prevBalance => prevBalance + 1);
};

  return (
    <div className="Home">
      <div className="bg-image"></div>
      <div className="Home-content">
        <div className="balance-display">
          <img src="/coin.png" alt="Coin" className="coin-icon" />
          <span className="balance-amount">{userBalance}</span>
        </div>
        <button className="main-button" onClick={handleMainButtonClick}>
          <img src="/btns/robot.png" alt="Start" />
        </button>
      </div>
      <div className="nav-btns">
        <button className="round-button">
          <img src="/btns/team.png" alt="Team" />
        </button>
        <button className="round-button">
          <img src="/btns/task.png" alt="Task" />
        </button>
        <button className="round-button">
          <img src="/btns/tap.png" alt="Tap" />
        </button>
        <button className="round-button">
          <img src="/btns/boost.png" alt="Boost" />
        </button>
        <button className="round-button">
          <img src="/btns/stat.png" alt="Statistics" />
        </button>
      </div>
    </div>
  );
}

export default Home;
