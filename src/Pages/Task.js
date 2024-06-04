import './Task.css';
import React, { useState } from 'react';

const Task = ({ userBalance }) => {
  const [selectedTab, setSelectedTab] = useState('special');
  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'special':
        return (
          <div className="tasks">
            <TaskItem text="JOIN OUR X (TWITTER)" reward="500 000" />
            <TaskItem text="JOIN OUR TELEGRAM" reward="250 000" />
            <TaskItem text="JOIN OUR YOUTUBE" reward="250 000" />
          </div>
        );
      case 'leagues':
        return (
          <div className="tasks">
            <LeagueItem text="SILVER LEAGUE" reward="5 000 000" image='./ranks/blue.png' />
            <LeagueItem text="GOLD LEAGUE" reward="10 000 000" image="./ranks/gold.png" />
            <LeagueItem text="DIAMOND LEAGUE" reward="50 000 000" image="./ranks/neon.png" />
          </div>
        );
      case 'ref-tasks':
        return (
          <div className="tasks">
            <InviteFriendItem text="INVITE 3 FRIENDS" reward="50 000" image='./tasks/people1.png' />
            <InviteFriendItem text="INVITE 10 FRIENDS" reward="100 000" image='./tasks/people2.png'/>
            <InviteFriendItem text="INVITE 25 FRIENDS" reward="500 000" image='./tasks/people3.png'/>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="Task">
      <div className="bg-image" />
      <header className="header">
        <div className="balance-display-task">
          <img src="/coin.png" alt="Coin" className="coin-icon" />
          <span className="balance-amount">{userBalance}</span>
        </div>
        <div className="gold">
          <img src='./ranks/gold.png' className='rank-img' alt="Gold Rank" />
          <span className="gold-text">GOLD</span>
          <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open" />
          </button>
        </div>
      </header>
      
      <nav className="nav">
        <div 
          className={`tab ${selectedTab === 'special' ? 'selected' : ''}`} 
          onClick={() => handleTabClick('special')}
        >
          SPECIAL
        </div>
        <div 
          className={`tab ${selectedTab === 'leagues' ? 'selected' : ''}`} 
          onClick={() => handleTabClick('leagues')}
        >
          LEAGUES
        </div>
        <div 
          className={`tab ${selectedTab === 'ref-tasks' ? 'selected' : ''}`} 
          onClick={() => handleTabClick('ref-tasks')}
        >
          REF TASKS
        </div>
      </nav>

      {renderContent()}
    </div>
  );
};

const TaskItem = ({ text, reward }) => (
  <div className="task-item">
    <img src='./tasks/task.png' alt="icon" className="task-icon" />
    <div className="task-text">{text}</div>
    <div className="task-reward">
      <img src='./coin.png' alt="coin" className="reward-icon" />
      <span>{reward}</span>
    </div>
    <button className='open-btn'>
      <img src='./tasks/open.png' className='open-icon' alt="Open" />
    </button>
  </div>
);

const LeagueItem = ({ text, reward, image }) => (
  <div className="task-item">
    <img src={image} alt="icon" className="task-icon" />
    <div className="task-text">{text}</div>
    <div className="task-reward">
      <img src='./coin.png' alt="coin" className="reward-icon" />
      <span>{reward}</span>
    </div>
    <button className='open-btn'>
      <img src='./tasks/open.png' className='open-icon' alt="Open" />
    </button>
  </div>
);
const InviteFriendItem = ({ text, reward, image }) => (
    <div className="task-item">
      <img src={image} alt="icon" className="task-icon" />
      <div className="task-text">{text}</div>
      <div className="task-reward">
        <img src='./coin.png' alt="coin" className="reward-icon" />
        <span>{reward}</span>
      </div>
    </div>
  );
export default Task;
