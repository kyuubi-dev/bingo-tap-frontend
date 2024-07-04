// src/components/Task.js
import './Task.css';
import React, {useState, useEffect, useRef, memo} from 'react';
import './TextStyle.css';
import { useLocation } from 'react-router-dom';
import CompletionMessage from './ModelMessage';
import axios, {isCancel} from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component
import leagues from './leaguaData';

const Task = ({ telegramId, ws }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialBalance = location.state?.userBalance || 0;
    const query = new URLSearchParams(location.search);
    const defaultTab = query.get('tab') || 'special';
    const [userBalance, setUserBalance] = useState(initialBalance);
    const [userPoints, setUserPoints] = useState(0);
    const [userLeague, setUserLeague] = useState('');
    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const [tasksCompleted, setTasksCompleted] = useState(
        JSON.parse(localStorage.getItem('tasksCompleted')) || {});
    const [tasks, setTasks] = useState([]);
    const [referralTasksCompleted, setReferralTasksCompleted] = useState(
        JSON.parse(localStorage.getItem('referralTasksCompleted')) || {}
    );
    const [completedLeagues, setCompletedLeagues] = useState(JSON.parse(localStorage.getItem('completedLeagues')) || {});
    const [completionMessage, setCompletionMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Loading state
    const [userData, setUserData] = useState([]);
    const [referralCount, setReferralCount] = useState(0);
    useEffect(() => {
        ws.send(JSON.stringify({ type: 'requestUserData', telegram_id: telegramId }));

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'userData') {
                setUserData(data);
                setReferralCount(data.referral_count)
            }
        };

    }, [telegramId]);
    useEffect(() => {
        const storedTasksCompleted = JSON.parse(localStorage.getItem('tasksCompleted')) || {};
        setTasksCompleted(storedTasksCompleted);
        const storedCompletedLeagues = JSON.parse(localStorage.getItem('completedLeagues')) || {};
        setCompletedLeagues(storedCompletedLeagues);
        const storedReferralTasksCompleted = JSON.parse(localStorage.getItem('referralTasksCompleted')) || {};
        setReferralTasksCompleted(storedReferralTasksCompleted);

    }, []);

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
        fetchTasks();
        const interval = setInterval(fetchUserBalance, 30000);

        return () => clearInterval(interval);
    }, [telegramId]);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${config.apiBaseUrl}/tasks`);
            console.log(response)
            const tasksData = response.data.map(task => {

                return task;
            });
            setTasks(tasksData);
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
        }
    };


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
        setTasks(updatedTasks);
        const newBalance = userBalance + reward;
        setUserBalance(newBalance);
        // Зберігання інформації про завершення у localStorage (необов'язково, залежить від вашої логіки)
        const updatedTasksCompleted = { ...tasksCompleted, [taskId]: true };
        setTasksCompleted(updatedTasksCompleted);
        localStorage.setItem('tasksCompleted', JSON.stringify(updatedTasksCompleted));
        // Update balance on server
        try {
            await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                balance: newBalance
            });
        } catch (error) {
            console.error('Ошибка при обновлении баланса на сервере:', error);
        }
        ws.send(JSON.stringify({ type: 'requestUserData', telegram_id: telegramId }));

        setCompletionMessage(`YOU SUCCESSFULLY ENDED TASK! REWARD: ${reward}`);
    };

    const handleCompletionMessageClose = () => {
        setCompletionMessage('');
    };

    const handleClaimLeague = async (league) => {
        const progress = userData.leagueProgress && userData.leagueProgress[league.name] ? userData.leagueProgress[league.name] : 0;

        if (progress === 100 || userBalance >= league.requiredPoints) {
            const updatedCompletedLeagues = { ...completedLeagues, [league.name]: true };
            setCompletedLeagues(updatedCompletedLeagues);
            localStorage.setItem('completedLeagues', JSON.stringify(updatedCompletedLeagues));
            const newBalance = userBalance + league.reward;
            setUserBalance(newBalance);
            setCompletionMessage(`League claimed: ${league.name}, reward - ${league.reward}`);
            try {
                await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                    balance: newBalance
                });
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

    const handleReferralTaskCompletion = async (taskId, reward) => {
        // Оновлюємо стан виконаних реферальних завдань
        const updatedReferralTasksCompleted = { ...referralTasksCompleted, [taskId]: true };
        setReferralTasksCompleted(updatedReferralTasksCompleted);
        localStorage.setItem('referralTasksCompleted', JSON.stringify(updatedReferralTasksCompleted));

        // Оновлюємо баланс користувача
        const newBalance = userBalance + reward;
        setUserBalance(newBalance);
        setCompletionMessage(`Referral task completed, reward - ${reward}`);

        // Оновлюємо баланс на сервері
        try {
            await axios.put(`${config.apiBaseUrl}/save-balance/${telegramId}`, {
                balance: newBalance
            });
            console.log('Balance updated successfully');
        } catch (error) {
            console.error('Error updating balance on the server:', error);
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
                                xisCompleted={tasksCompleted[task.task_id] || false}
                                url={task.url} // Pass the URL to TaskItem
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
                                completed={completedLeagues[league.name]|| false}
                                onClaim={() => handleClaimLeague(league)}
                                leagueProgress={leagueProgress}
                            />
                        ))}
                    </div>
                );
            case 'ref-tasks':
                return (
                    <div className="tasks">
                        <InviteFriendItem text="INVITE 3 FRIENDS" reward="50 000" navigate={navigate} image='./tasks/people1.png'   requiredReferrals={3}   referralCount={referralCount}
                                          onClaim={() => handleReferralTaskCompletion('invite3', 50000) }
                                          xisCompleted={referralTasksCompleted['invite3'] || false}/>
                        <InviteFriendItem text="INVITE 10 FRIENDS" reward="100 000" navigate={navigate} image='./tasks/people2.png'   referralCount={referralCount}    requiredReferrals={10}
                                          onClaim={() => handleReferralTaskCompletion('invite10', 100000)}
                                          xisCompleted={referralTasksCompleted['invite10'] || false}/>
                        <InviteFriendItem text="INVITE 25 FRIENDS" reward="500 000" navigate={navigate} image='./tasks/people3.png'   referralCount={referralCount}      requiredReferrals={25}
                                          onClaim={() => handleReferralTaskCompletion('invite25', 500000)}
                                          xisCompleted={referralTasksCompleted['invite25'] || false}/>
                        <InviteFriendItem text="INVITE 100 FRIENDS" reward="1 000 000" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={100}
                                          onClaim={() => handleReferralTaskCompletion('invite100', 1000000)}
                                          xisCompleted={referralTasksCompleted['invite100'] || false}/>
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

const TaskItem = React.memo(({ task, onCompletion,xisCompleted, url })=> {
    const [isCompleted, setIsCompleted] = useState(xisCompleted);
    const handleCompletion = () => {
        if (!isCompleted) {
            if (url) {
                window.open(url, '_blank');
            } else {
                onCompletion();
            }
            setIsCompleted(true); // Встановлюємо прапорець завершення, коли завдання виконано
            onCompletion && onCompletion(); // Викликаємо функцію зовнішнього завершення, якщо вона є
        }
    };
    return <a
        href={isCompleted ? '#' : task.url}
        className={`task-item ${isCompleted ? 'completed' : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCompletion}
        style={{ pointerEvents: isCompleted || task.task_id === 10 ? 'none' : 'auto', opacity: isCompleted || task.task_id === 10 ? 0.5 : 1 }}
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
});



const LeagueItem = ({ league, completed, onClaim,leagueProgress }) => {
    const progressData = leagueProgress.find(item => item.league === league.name);
    const progress = progressData ? progressData.progress : 0;
    console.log(progress);
    return (
        <div className={`task-item leagua ${completed ? 'completed' : ''}`}>
            <img src={league.img} alt="icon" loading="lazy"  className="task-icon"/>
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

const InviteFriendItem = memo(({ text, reward, image, referralCount, navigate, requiredReferrals, onClaim, xisCompleted }) => {
    const handleClick = () => {
        if (!xisCompleted && referralCount < requiredReferrals) {
            navigate('/team'); // Використання navigate для навігації
        } else if (referralCount >= requiredReferrals && !xisCompleted) {
            onClaim();
        }
    };

    return (
        <div className={`task-item ${xisCompleted ? 'completed' : ''}${referralCount >= requiredReferrals ? 'done' : ''}`}
             onClick={handleClick}
             style={{ pointerEvents: xisCompleted ? 'none' : 'auto', opacity: xisCompleted ? 0.5 : 1 }}>
            <img src={image} alt="icon" className="task-icon" />
            <div className="task-text blue-style">{text}</div>
            <div className="task-reward">
                <img src='./coin.png' alt="coin" className="reward-icon" />
                <span className='gold-style'>{reward}</span>
            </div>
            {referralCount >= requiredReferrals && !xisCompleted ? (
                <button
                    className='claim-button blue-style'
                    onClick={onClaim}
                >
                    Claim
                </button>
            ) : (
                <button className='open-btn'>
                    <img src='./tasks/open.png' className='open-icon' alt="Open" />
                </button>
            )}
        </div>
    );
});


export default Task;
