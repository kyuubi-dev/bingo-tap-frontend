// src/components/Task.js
import './Task.css';
import React, { useState, useEffect } from 'react';
import './TextStyle.css';
import { useLocation } from 'react-router-dom';
import CompletionMessage from './ModelMessage';
import axios, {isCancel} from 'axios';
import config from '../config';
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component
import leagues from './leaguaData';
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
    const [isLoading, setIsLoading] = useState(true); // Loading state
    const [userData, setUserData] = useState([]);
    useEffect(() => {
        const ws = new WebSocket(config.wsBaseUrl);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'requestUserData', telegram_id: telegramId }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'userData') {
                setUserData(data);
            }
        };

        return () => {
            ws.close();
        };
    }, [telegramId]);
    useEffect(() => {
        const storedTasksCompleted = JSON.parse(localStorage.getItem('tasksCompleted')) || {};
        setTasksCompleted(storedTasksCompleted);
    }, []);
    const markCompletedLeagues = () => {
        const updatedCompletedLeagues = {};

        leagues.forEach(league => {
            if (userPoints >= league.requiredPoints) {
                updatedCompletedLeagues[league.name] = true;
            }
        });

        setCompletedLeagues(updatedCompletedLeagues);
        localStorage.setItem('completedLeagues', JSON.stringify(updatedCompletedLeagues));

    };


    useEffect(() => {
        markCompletedLeagues();
    }, [userBalance]);
    useEffect(() => {
        const initializeUserData = async () => {
            // Отримання даних користувача, які зберігаються локально
            const cachedUserBalance = localStorage.getItem('userBalance');

            if (cachedUserBalance) {
                setUserBalance(parseInt(cachedUserBalance));
            }
            await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                balance: cachedUserBalance
            });
            setIsLoading(true);
        };

        initializeUserData();
    }, []);

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
                    setUserLeague(userData.userLeague);
                }
                setIsLoading(false); // Set loading to false after data is fetched
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                setIsLoading(false); // Ensure loading state is reset in case of error
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
        const updatedTasks = tasks.map(task => {
            if (task.task_id === taskId) {
                return { ...task, isCompleted: true };
            }
            return task;
        });
        console.log(updatedTasks)
        setTasks(updatedTasks);
        const newBalance = userBalance + reward;
        // Зберігання інформації про завершення у localStorage (необов'язково, залежить від вашої логіки)
        const updatedTasksCompleted = { ...tasksCompleted, [taskId]: true };
        console.log(updatedTasksCompleted)
        setTasksCompleted(updatedTasksCompleted);
        localStorage.setItem('tasksCompleted', JSON.stringify(updatedTasksCompleted));
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
    };

    const handleCompletionMessageClose = () => {
        setCompletionMessage('');
    };

    const handleClaimLeague = async (league) => {
        if (userBalance >= league.requiredPoints) {
            const updatedCompletedLeagues = { ...completedLeagues, [league.name]: true };
            setCompletedLeagues(updatedCompletedLeagues);
            console.log(updatedCompletedLeagues)
            localStorage.setItem('completedLeagues', JSON.stringify(updatedCompletedLeagues));
            const newBalance = userBalance + league.reward;
            console.log(completedLeagues)
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

        } else {
            setCompletionMessage(`Not enough points for league: ${league.name}`);
        }
    };

    const getLeagueImage = (league) => {
        const leagueData = leagues.find(l => l.name.toUpperCase() === league.toUpperCase());
        return leagueData ? leagueData.img : './ranks/wood.png';
    };

    const updateLeague = async () => {
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

        switch (selectedTab) {
            case 'special':
                return (
                    <div className="tasks">
                        {tasks.map(task => (
                            <TaskItem
                                key={task.task_id}
                                task={task}
                                onCompletion={() => handleTaskCompletion(task.task_id, task.reward)}
                                xisCompleted={task.isCompleted}
                            />
                        ))}
                    </div>
                );
            case 'leagues':
                const { leagueProgress } = userData;
                return (

                    <div className="tasks">
                        {leagues.map(league => (
                            <LeagueItem
                                key={league.name}
                                league={league}
                                userPoints={userBalance}
                                completed={completedLeagues[league.name]}
                                onClaim={() => handleClaimLeague(league)}
                                leagueProgress={leagueProgress}
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



    if (isLoading) {
        return <LoadingScreen />;
    }



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

const TaskItem = ({ task, onCompletion,xisCompleted }) => {
    console.log(xisCompleted)
    const [isCompleted, setIsCompleted] = useState(xisCompleted);
    const handleCompletion = () => {
        if (!isCompleted) {
            setIsCompleted(true); // Встановлюємо прапорець завершення, коли завдання виконано
            onCompletion && onCompletion(); // Викликаємо функцію зовнішнього завершення, якщо вона є
        }
    };
    return <a
        href={task.url}
        className={`task-item ${isCompleted ? 'completed' : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCompletion}
    >
        <img src='./tasks/task.png' alt="icon" className="task-icon"/>
        <div className="task-text blue-style">{isCompleted ? `${task.task_name} - COMPLETED` : task.task_name}</div>
        <div className="task-reward">
            <img src='./coin.png' alt="coin" className="reward-icon"/>
            <span className='rew-text gold-style'>{task.reward}</span>
        </div>
        <button className='open-btn'>
            <img src='./tasks/open.png' className='open-icon' alt="Open"/>
        </button>
    </a>
};



const LeagueItem = ({ league, completed, onClaim,leagueProgress }) => {
    const progress = leagueProgress.find(progress => progress.league === league.name)?.progress || 0;
    return (
        <div className={`task-item leagua ${completed ? 'completed' : ''}`}>
            <img src={league.img} alt="icon" className="task-icon"/>
            <div className="task-text leagua blue-style">{league.name.toUpperCase()}</div>
            <div className="energy-container">
                <div className="energy-bar" style={{width: `${progress}%`}}></div>
            </div>
            <div className="task-reward leagua">
                <img src='./coin.png' alt="coin" className="reward-icon"/>
                <span className='gold-style'>{league.reward}</span>
            </div>
            <button
                className="claim-button blue-style"
                onClick={onClaim}
                disabled={completed}
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
