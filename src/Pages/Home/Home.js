import React, { useState } from 'react';
import './Home.css';

function Home() {
  const [userBalance, setUserBalance] = useState(0);
  const [energy, setEnergy] = useState(1500);
  const maxEnergy = 1500;

  const [navButtonActive, setNavButtonActive] = useState({
    team: false,
    task: false,
    tap: false,
    boost: false,
    stat: false
  });

  const handleMainButtonClick = () => {
    if (energy >= 1) {
      setEnergy(prevEnergy => prevEnergy - 1);
      setUserBalance(prevBalance => prevBalance + 1);
    }
  };

  const handleNavButtonClick = (buttonName) => {
    const updatedNavButtonActive = { ...navButtonActive };
    Object.keys(updatedNavButtonActive).forEach(key => {
      updatedNavButtonActive[key] = key === buttonName ? true : false;
    });
    setNavButtonActive(updatedNavButtonActive);
  };

  const energyBarWidth = (energy / maxEnergy) * 100 + '%';

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
        <div className="energy-display">
          {energy}/{maxEnergy}
          <div className="energy-container">
            <div className="energy-bar" style={{ width: energyBarWidth }}></div> {/* Полоса енергії */}
          </div>
        </div>
      </div>
      <div className="nav-btns">
        <button
          className="round-button"
          onClick={() => handleNavButtonClick('team')}
        >
          <img
            src={navButtonActive.team ? "/btns/team_active.png" : "/btns/team.png"}
            alt="Team"
          />
        </button>
        <button
          className="round-button"
          onClick={() => handleNavButtonClick('task')}
        >
          <img
            src={navButtonActive.task ? "/btns/task_active.png" : "/btns/task.png"}
            alt="Task"
          />
        </button>
        <button
          className="round-button"
          onClick={() => handleNavButtonClick('tap')}
        >
          <img
            src={navButtonActive.tap ? "/btns/tap_active.png" : "/btns/tap.png"}
            alt="Tap"
          />
        </button>
        <button
          className="round-button"
          onClick={() => handleNavButtonClick('boost')}
        >
          <img
            src={navButtonActive.boost ? "/btns/boost_active.png" : "/btns/boost.png"}
            alt="Boost"
          />
        </button>
        <button
          className="round-button"
          onClick={() => handleNavButtonClick('stat')}
        >
          <img
            src={navButtonActive.stat ? "/btns/stat_active.png" : "/btns/stat.png"}
            alt="Statistics"
          />
        </button>
      </div>
    </div>
  );
}

export default Home;
