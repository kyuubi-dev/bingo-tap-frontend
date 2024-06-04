import './Task.css';
import React, { useState } from 'react';

const Task = ({userBalance}) => {

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
                    {/* Добавьте здесь контент для вкладки Leagues */}
                    <TaskItem text="LEAGUE TASK 1" reward="300 000" />
                    <TaskItem text="LEAGUE TASK 2" reward="450 000" />
                  </div>
                );
              case 'ref-tasks':
                return (
                  <div className="tasks">
                    {/* Добавьте здесь контент для вкладки Ref Tasks */}
                    <TaskItem text="REFERRAL TASK 1" reward="600 000" />
                    <TaskItem text="REFERRAL TASK 2" reward="700 000" />
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
          <img src='./ranks/gold.png' className='rank-img'/>
            <span className="gold-text">GOLD</span>
            <button className='open-btn'>
                <img src='./tasks/open.png' className='open-icon'/>
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
  
        <div className="tasks">
          <TaskItem
            text="JOIN OUR X (TWITTER)"
            reward="500 000"
          />
          <TaskItem
            text="JOIN OUR TELEGRAM"
            reward="250 000"
          />
          <TaskItem
            text="JOIN OUR YOUTUBE"
            reward="250 000"
          />
          <TaskItem
          text="CONNECT YOUR WALLET"
          reward="100 000"
          />
        </div>
      </div>
    );
  };
  const TaskItem = ({  text, reward }) => (
    <div className="task-item">
      <img src='./tasks/task.png' alt="icon" className="task-icon" />
      <div className="task-text">{text}</div>
      <div className="task-reward">
        <img src='./coin.png' alt="coin" className="reward-icon" />
        <span>{reward}</span>
      </div>
      <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon'/>
          </button>
    </div>
  );
  
  export default Task;