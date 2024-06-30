import React, { useState,useEffect } from 'react';
import './Navigation.css';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const [navButtonActive, setNavButtonActive] = useState({
    team: false,
    task: false,
    tap: true,
    boost: false,
    stat: false
  });

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

  return (
    <div className="nav-btns">
      <Link to="/team" className="round-button" onClick={() => handleNavButtonClick('team')}>
        <img src={navButtonActive.team ? "/btns/team_active.png" : "/btns/team.png"} alt="Team" />
      </Link>
      <Link to="/task" className="round-button" onClick={() => handleNavButtonClick('task')}>
        <img src={navButtonActive.task ? "/btns/task_active.png" : "/btns/task.png"} alt="Task" />
      </Link>
      <Link to="/" className="round-button" onClick={() => handleNavButtonClick('tap')}>
        <img src={navButtonActive.tap ? "/btns/tap_active.png" : "/btns/tap.png"} alt="Tap" />
      </Link>
      <Link to="/boost" className="round-button" onClick={() => handleNavButtonClick('boost')}>
        <img src={navButtonActive.boost ? "/btns/boost_active.png" : "/btns/boost.png"} alt="Boost" />
      </Link>
      <Link to="/stat" className="round-button" onClick={() => handleNavButtonClick('stat')}>
        <img src={navButtonActive.stat ? "/btns/stat_active.png" : "/btns/stat.png"} alt="Statistics" />
      </Link>
    </div>
  );
}

export default Navigation;
