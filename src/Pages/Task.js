import './Task.css';
import React, { useState, useEffect } from 'react';
import './TextStyle.css';
import { useLocation } from 'react-router-dom';
import CompletionMessage from './ModelMessage';
import axios from 'axios';
import config from '../config';

const Task = ({ telegramId }) => {
    const location = useLocation();
    const initialBalance = location.state?.userBalance || 0;
    const query = new URLSearchParams(location.search);
    const defaultTab = query.get('tab') || 'special';
    const [userBalance, setUserBalance] = useState(initialBalance);
    const [userPoints, setUserPoints] = useState(0);
    const [userLeague, setUserLeague] = useState('');
    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const [tasksCompleted, setTasksCompleted] = useState(
        JSON.parse(localStorage.getItem('tasksCompleted')) || {}
    );
    const [tasks, setTasks] = useState([]);
    const [completedLeagues, setCompletedLeagues] = useState(
        JSON.parse(localStorage.getItem('completedLeagues')) || {}
    );
    const [completionMessage, setCompletionMessage] = useState('');

    useEffect(() => {
        setSelectedTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        const fetchUserBalance = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${telegramId}`);
                const userData = response.data;
                if (userData.userExists) {
                    setUserBalance(userData.userBalance);
                    setUserPoints(userData.userPoints);
                    setUserLeague(userData.userLeague);
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
            }
        };

        fetchUserBalance();

        const interval = setInterval(fetchUserBalance, 30000);

        return () => clearInterval(interval);
    }, [telegramId]);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${config.apiBaseUrl}/tasks`);
            const tasksData = response.data;
            setTasks(tasksData);
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTabClick = (tab) => {
        setSelectedTab(tab);
    };

    const handleGoldButtonClick = () => {
        setSelectedTab('leagues');
    };

    const handleTaskCompletion = async (taskId, reward) => {
        const updatedTasksCompleted = { ...tasksCompleted, [taskId]: true };
        setTasksCompleted(updatedTasksCompleted);
        localStorage.setItem('tasksCompleted', JSON.stringify(updatedTasksCompleted));
        const newBalance = userBalance + reward;

        setUserBalance(newBalance);
        setCompletionMessage(`Task completed: ${taskId}, reward - ${reward}`);

        // Update balance on server
        try {
            await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                balance: newBalance
            });
            console.log('Баланс успешно обновлен на сервере');
        } catch (error) {
            console.error('Ошибка при обновлении баланса на сервере:', error);
        }

        // Check and update league if necessary
        updateLeague();
    };

    const handleCompletionMessageClose = () => {
        setCompletionMessage('');
    };

    const handleClaimLeague = async (league) => {
        if (userBalance >= league.requiredPoints) {
            const updatedCompletedLeagues = {...completedLeagues, [league.name]: true};
            setCompletedLeagues(updatedCompletedLeagues);
            localStorage.setItem('completedLeagues', JSON.stringify(updatedCompletedLeagues));
            const newBalance = userBalance + league.reward;

            setUserBalance(newBalance);
            setCompletionMessage(`League claimed: ${league.name}, reward - ${league.reward}`);

            try {
                await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                    balance: newBalance
                });
                console.log('Баланс успешно обновлен на сервере');
            } catch (error) {
                console.error('Ошибка при обновлении баланса на сервере:', error);
            }

            // Check and update league if necessary
            updateLeague();
        } else {
            setCompletionMessage(`Not enough points for league: ${league.name}`);
        }
    };

    const getLeagueImage = (league) => {
        switch (league.toUpperCase()) {
            case 'SILVER':
                return './ranks/blue.png';
            case 'GOLD':
                return './ranks/gold.png';
            case 'DIAMOND':
                return './ranks/neon.png';
            case 'EMERALD':
                return './ranks/green.png'
            default:
                return './ranks/blue.png';
        }
    };

    const updateLeague = async () => {
        const leagues = [
            { name: 'DIAMOND', requiredPoints: 10000 },
            { name: 'GOLD', requiredPoints: 5000 },
            { name: 'SILVER', requiredPoints: 1000 }
        ];

        for (const league of leagues) {
            if (userPoints >= league.requiredPoints && userLeague !== league.name) {
                setUserLeague(league.name);
                try {
                    await axios.put(`${config.apiBaseUrl}/update-league/${telegramId}`, {
                        league: league.name
                    });
                    console.log('Лига успешно обновлена на сервере');
                    setCompletionMessage(`Congratulations! You have reached ${league.name} league!`);
                } catch (error) {
                    console.error('Ошибка при обновлении лиги на сервере:', error);
                }
                break; // Exit the loop once the appropriate league is found
            }
        }
    };

    const renderContent = () => {
        const filteredTasks = tasks.filter(task => !tasksCompleted[task.task_id]);

        switch (selectedTab) {
            case 'special':
                return (
                    <div className="tasks">
                        {filteredTasks.map(task => (
                            <TaskItem
                                key={task.task_id}
                                task={task}
                                onCompletion={() => handleTaskCompletion(task.task_id, task.reward)}
                            />
                        ))}
                    </div>
                );
            case 'leagues':
                const leagues = [
                    { name: 'SILVER', requiredPoints: 10, reward: 500, image: './ranks/blue.png' },
                    { name: 'GOLD', requiredPoints: 50, reward: 100, image: './ranks/gold.png' },
                    { name: 'DIAMOND', requiredPoints: 100, reward: 500, image: './ranks/neon.png' },
                ];
                return (
                    <div className="tasks">
                        {leagues.map(league => (
                            <LeagueItem
                                key={league.name}
                                league={league}
                                userPoints={userPoints}
                                completed={completedLeagues[league.name]}
                                onClaim={() => handleClaimLeague(league)}
                            />
                        ))}
                    </div>
                );
            case 'ref-tasks':
                return (
                    <div className="tasks">
                        <InviteFriendItem text="INVITE 3 FRIENDS" reward="50 000" image='./tasks/people1.png' />
                        <InviteFriendItem text="INVITE 10 FRIENDS" reward="100 000" image='./tasks/people2.png'/>
                        <InviteFriendItem text="INVITE 25 FRIENDS" reward="500 000" image='./tasks/people3.png'/>
                        <InviteFriendItem text="INVITE 100 FRIENDS" reward="1 000 000" image='./tasks/people3.png' />
                        <InviteFriendItem text="INVITE 1000 FRIENDS" reward="5 000 000" image='./tasks/people3.png'/>
                        <InviteFriendItem text="INVITE 10 000 FRIENDS" reward="10 000 000" image='./tasks/people3.png'/>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="Task">
            <div className='lightnings f-tab'>
                <img src='/16.png' className='lightning f-tab right' alt="Lightning Right"/>
                <img src='/17.png' className='lightning f-tab left' alt="Lightning Left"/>
            </div>
            <header className="header">
                <div className="balance-display-task">
                    <img src="/coin.png" alt="Coin" className="coin-icon"/>
                    <span className="blue-style">{userBalance}</span>
                </div>
                <div className="gold" onClick={handleGoldButtonClick}>
                    <img src={getLeagueImage(userLeague)} className='rank-img' alt="User Rank"/>
                    <span className="gold-style">{userLeague.toUpperCase()}</span>
                    <button className='open-btn'>
                        <img src='./tasks/open.png' className='open-icon' alt="Open"/>
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

            {completionMessage && (
                <CompletionMessage
                    message={completionMessage}
                    onClose={handleCompletionMessageClose}
                />
            )}

            {renderContent()}
        </div>
    );
};

const TaskItem = ({ task, onCompletion }) => (
    <a
        href={task.url}
        className="task-item"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onCompletion && onCompletion()}
    >
        <img src='./tasks/task.png' alt="icon" className="task-icon" />
        <div className="task-text blue-style">{task.task_name}</div>
        <div className="task-reward">
            <img src='./coin.png' alt="coin" className="reward-icon" />
            <span className='rew-text gold-style'>{task.reward}</span>
        </div>
        <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open" />
        </button>
    </a>
);

const LeagueItem = ({ league, userPoints, completed, onClaim }) => {
    const progressPercent = (userPoints / league.requiredPoints) * 100;

    return (
        <div className={`task-item leagua ${completed ? 'completed' : ''}`}>
            <img src={league.image} alt="icon" className="task-icon"/>
            <div className="task-text leagua blue-style">{league.name.toUpperCase()}</div>
            <div className="energy-container">
                <div className="energy-bar" style={{width: `${progressPercent}%`}}></div>
            </div>
            <div className="task-reward leagua">
                <img src='./coin.png' alt="coin" className="reward-icon"/>
                <span className='gold-style'>{league.reward}</span>
            </div>
            <button
                className="claim-button blue-style"
                onClick={onClaim}
                disabled={userPoints < league.requiredPoints || completed}
            >
                {completed ? 'CLAIMED' : 'CLAIM'}
            </button>
        </div>
    );
};

const InviteFriendItem = ({text, reward, image}) => (
    <div className="task-item">
        <img src={image} alt="icon" className="task-icon"/>
        <div className="task-text blue-style">{text}</div>
        <div className="task-reward">
            <img src='./coin.png' alt="coin" className="reward-icon"/>
            <span className='gold-style'>{reward}</span>
        </div>
        <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open"/>
        </button>
    </div>
);

export default Task;
