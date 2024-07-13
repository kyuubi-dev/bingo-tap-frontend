import React, { useState,useEffect } from 'react';
import './Navigation.css';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import tasksData from './tasksData.js'; // Import the tasks array
function Navigation({telegramId, showBoostModal}) {
    console.log(showBoostModal)
  const [navButtonActive, setNavButtonActive] = useState({
    team: false,
    task: false,
    tap: true,
    boost: false,
    stat: false
  });
    const [dailyBoosts, setDailyBoosts] = useState({
        "tapingGuru": { charges: 0, lastUpdate: Date.now() },
        "fullTank": { charges: 0, lastUpdate: Date.now() },
    });
    const [hasActiveTasks, setHasActiveTasks] = useState(false);
    const [hasActiveBoost, setHasActiveBoost] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        setNavButtonActive({
            team: path === '/team',
            task: path === '/task',
            tap: path === '/',
            boost: path === '/boost',
            stat: path === '/stat'
        });

    }, [location]);

  const handleNavButtonClick = (buttonName) => {
    setNavButtonActive({
      team: buttonName === 'team',
      task: buttonName === 'task',
      tap: buttonName === 'tap',
      boost: buttonName === 'boost',
      stat: buttonName === 'stat'
    });
  };
    const fetchTasks = async () => {
        try {
            // Directly use the imported tasks array instead of making an API request
            console.log(tasksData);
            checkActiveTasks(tasksData);
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
        }
    };
    const checkActiveTasks = (tasks) => {
        const tasksCompleted = JSON.parse(localStorage.getItem('tasksCompleted')) || {};
        console.log(tasksCompleted);
        console.log(tasks);
        const activeTasks = tasks.some(task => !tasksCompleted[task.task_id]);
        console.log(activeTasks);
        setHasActiveTasks(activeTasks);
    };

    const checkUserBoosts = async () => {
        try {
            const response = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${telegramId}`);
            const userData = response.data;

            // Переконатися, що структура даних правильна
            if (userData && userData.dailyBoosts) {
                const boosts = ['tapingGuru', 'fullTank'];
                let chargesAreThree = false;

                boosts.forEach(boost => {
                    if (userData.dailyBoosts[boost].charges === 3) {
                        chargesAreThree = true;
                    }
                });

                setHasActiveBoost(chargesAreThree);
            } else {
                console.warn('Недостатньо даних для перевірки бустів');
                setHasActiveBoost(false);
            }
        } catch (error) {
            console.error('Ошибка при проверке пользовательских бустов:', error);
        }
    };

    useEffect(() => {
        checkUserBoosts();
        fetchTasks();
    }, []);
  return (
      <div className={`nav-btns ${showBoostModal ? 'hidden' : ''}`}>
          <Link to="/team" className="round-button" onClick={() => handleNavButtonClick('team')}>
              <img src={navButtonActive.team ? "/btns/team_active.png" : "/btns/team.png"} alt="Team"/>

          </Link>
          <Link to="/task" className="round-button" onClick={() => handleNavButtonClick('task')}>
              <img src={navButtonActive.task ? "/btns/task_active.png" : "/btns/task.png"} alt="Task"/>
              {hasActiveTasks && <div className="red-indicator"></div>}
          </Link>
          <Link to="/" className="round-button" onClick={() => handleNavButtonClick('tap')}>
              <img src={navButtonActive.tap ? "/btns/tap_active.png" : "/btns/tap.png"} alt="Tap"/>
          </Link>
          <Link to="/boost" className="round-button" onClick={() => handleNavButtonClick('boost')}>
              <img src={navButtonActive.boost ? "/btns/boost_active.png" : "/btns/boost.png"} alt="Boost"/>
              {hasActiveBoost && <div className="red-indicator"></div>}
          </Link>
          <Link to="/stat" className="round-button" onClick={() => handleNavButtonClick('stat')}>
              <img src={navButtonActive.stat ? "/btns/stat_active.png" : "/btns/stat.png"} alt="Statistics"/>
          </Link>
      </div>
  );
}

export default Navigation;
