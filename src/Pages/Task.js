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
import tasksData from './tasksData.js'; // Import the tasks array

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
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [userData, setUserData] = useState([]);
    const [referralCount, setReferralCount] = useState(0);
    const [tapingBalance,setTapingBalance] = useState(0);
    const handleRequestData = () => {

        ws.send(JSON.stringify({ type: 'requestUserData', telegram_id: telegramId }));
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data from server:', data); // Add logging
            if (data.type === 'userData') {
                setUserData(data);
                setReferralCount(data.referral_count); // Use data directly
                if (data.userTotalBalance != null) {
                    console.log('Setting user balance:', data.userTotalBalance); // Add logging
                    setUserBalance(data.userTotalBalance);
                }
                if (data.league != null) setUserLeague(data.league);     // Use data directly
            }
        };
        fetchTasks();
        setIsLoading(true);
    };
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
            const cachedTapingUserBalance = localStorage.getItem('userTapingBalance');
            const energy = localStorage.getItem('energy');

            if (cachedUserBalance !== null) {
                setUserBalance(Number(cachedUserBalance));
            } else {
                setUserBalance(0);
            }
            if (cachedUserBalance) {
                setUserBalance(cachedUserBalance);
            }
            console.log(cachedTapingUserBalance)
            setTapingBalance(cachedTapingUserBalance);
            await axios.put(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
                newEnergy: parseInt(energy, 10)
            });
            await axios.put(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
                taping_balance: cachedTapingUserBalance !== null ? Number(cachedTapingUserBalance) : 0
            });

            await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                total_balance: cachedUserBalance !== null ? Number(cachedUserBalance) : 0
            });
            handleRequestData();
        };

        initializeUserData();
    }, []);

    useEffect(() => {
        setSelectedTab(defaultTab);
    }, [defaultTab]);

    const fetchTasks = async () => {
        try {
            const tasks = tasksData.map(task => {
                return task;
            });
            setTasks(tasks);

        } catch (error) {
            console.error('Ошибка при получении задач:', error);
        }
    };


    const handleTabClick = (tab) => {
        setSelectedTab(tab);
    };

    const handleGoldButtonClick = () => {
            navigate('/league-progress');
    };

    const handleTaskCompletion = async (taskId, reward,url) => {
        setTimeout(async () => {
            if (url.includes('t.me')) { // Check if the task involves Telegram
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/check-subscribes`, {
                        params: { telegram_id: telegramId }
                    });

                    const { userExists, userSubscribes } = response.data;

                    if (userExists && userSubscribes) {
                        let isSubscribed = false;

                        // Check subscription based on the task URL
                        if (url.includes('mantis_official') && userSubscribes.telegram_channel) {
                            isSubscribed = true;
                        } else if (url.includes('+lo0oLC5eywUxNTRk') && userSubscribes.telegram_group) {
                            isSubscribed = true;
                        } else if (url.includes('MetaBingoClub') && userSubscribes.telegram_metaBingo) {
                            isSubscribed = true;
                        }

                        if (isSubscribed) {
                            // Update completed tasks state
                            const updatedTasksCompleted = { ...tasksCompleted, [taskId]: true };
                            setTasksCompleted(updatedTasksCompleted);
                            localStorage.setItem('tasksCompleted', JSON.stringify(updatedTasksCompleted));

                            // Update user balance
                            const newBalance = userBalance + reward;
                            setUserBalance(newBalance);
                            localStorage.setItem('userBalance', newBalance);
                            setCompletionMessage(`Task completed, reward - ${reward}`);

                            // Update balance on the server
                            await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                                total_balance: newBalance
                            });
                            setCompletionMessage(`You ended task. Reward ${reward}`);

                            console.log('Balance updated successfully');
                        } else {
                            setCompletionMessage('You must subscribe to complete this task.');
                        }
                    } else {
                        setCompletionMessage('User not found or not subscribed.');
                    }
                } catch (error) {
                    console.error('Error checking subscription:', error);
                    setCompletionMessage('Error checking subscription.');
                }
            } else {
                // For tasks that are not related to Telegram, directly mark as completed
                const updatedTasksCompleted = { ...tasksCompleted, [taskId]: true };
                setTasksCompleted(updatedTasksCompleted);
                localStorage.setItem('tasksCompleted', JSON.stringify(updatedTasksCompleted));

                // Update user balance
                const newBalance = userBalance + reward;
                setUserBalance(newBalance);
                localStorage.setItem('userBalance', newBalance);
                setCompletionMessage(`Task completed, reward - ${reward}`);

                // Update balance on the server
                await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                    total_balance: newBalance
                });

                console.log('Balance updated successfully');
            }
        }, 10000); // 10 seconds delay
    };

    const handleCompletionMessageClose = () => {
        setCompletionMessage('');
    };

    const handleClaimLeague = async (league) => {
        const progress = userData.leagueProgress && userData.leagueProgress[league.name] ? userData.leagueProgress[league.name] : 0;

        if (progress === 100 || tapingBalance >= league.requiredPoints) {
            const updatedCompletedLeagues = { ...completedLeagues, [league.name]: true };
            setCompletedLeagues(updatedCompletedLeagues);
            localStorage.setItem('completedLeagues', JSON.stringify(updatedCompletedLeagues));
            const newBalance = userBalance + league.reward;
            setUserBalance(newBalance);
            localStorage.setItem('userBalance', newBalance);
            setCompletionMessage(`League claimed: ${league.name}, reward - ${league.reward}`);
            try {
                await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                    total_balance: newBalance
                });
            } catch (error) {
                console.error('Ошибка при обновлении баланса на сервере:', error);
            }
        } else {
            setCompletionMessage(`Not enough points for league: ${league.name}`);
        }
    };

    const getLeagueImage = (league) => {
        if (!league || typeof league !== 'string') {
            return './ranks/wood.png'; // Default image if league is undefined or not a string
        }

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
        localStorage.setItem('userBalance', newBalance);
        setCompletionMessage(`Referral task completed, reward - ${reward}`);
        // Оновлюємо баланс на сервері
        try {
            await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                total_balance: newBalance
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
                                onCompletion={() => handleTaskCompletion(task.task_id, task.reward, task.url)}
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
                        <InviteFriendItem text="INVITE 100 FRIENDS" reward="1 M" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={100}
                                          onClaim={() => handleReferralTaskCompletion('invite100', 1000000)}
                                          xisCompleted={referralTasksCompleted['invite100'] || false}/>
                        <InviteFriendItem text="INVITE 250 FRIENDS" reward="2.5 M" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={250}
                                          onClaim={() => handleReferralTaskCompletion('invite250', 2500000)}
                                          xisCompleted={referralTasksCompleted['invite250'] || false}/>
                        <InviteFriendItem text="INVITE 500 FRIENDS" reward="5 M" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={500}
                                          onClaim={() => handleReferralTaskCompletion('invite500', 5000000)}
                                          xisCompleted={referralTasksCompleted['invite500'] || false}/>
                        <InviteFriendItem text="INVITE 1000 FRIENDS" reward="10 M" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={1000}
                                          onClaim={() => handleReferralTaskCompletion('invite1000', 10000000)}
                                          xisCompleted={referralTasksCompleted['invite1000'] || false}/>
                        <InviteFriendItem text="INVITE 10 000 FRIENDS" reward="100 M" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={10000}
                                          onClaim={() => handleReferralTaskCompletion('invite10000', 100000000)}
                                          xisCompleted={referralTasksCompleted['invite10000'] || false}/>
                        <InviteFriendItem text="INVITE 100 000 FRIENDS" reward="1 B" navigate={navigate} image='./tasks/people3.png'    referralCount={referralCount}  requiredReferrals={100000}
                                          onClaim={() => handleReferralTaskCompletion('invite100000', 1000000000)}
                                          xisCompleted={referralTasksCompleted['invite100000'] || false}/>

                    </div>
                );
            default:
                return null;
        }
    };



    if (!isLoading) {
        return <LoadingScreen />;
    }


    const formatBalance = (balance) => {
        if (balance >= 1_000_000_000) {
            return (balance / 1_000_000_000).toFixed(3) + ' B';
        } else if (balance >= 1_000_000) {
            return (balance / 1_000_000).toFixed(3) + ' M';
        } else {
            return balance.toLocaleString(); // To add commas for thousands
        }
    };
    return (
        <div className="Task">
            <header className="header">
                <div className="balance-display-task">
                    <img src="/coin.png" alt="Coin" className="coin-icon"/>
                    <span className="blue-style">{formatBalance(userBalance)}</span>
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
    const handleCompletion = (event) => {
        if (!isCompleted) {
            if (url) {
                event.preventDefault(); // Prevent default navigation behavior
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

const formatBalance = (balance) => {
    if (balance >= 1_000_000_000) {
        return (balance / 1_000_000_000).toFixed(1) + ' B';
    } else if (balance >= 1_000_000) {
        return (balance / 1_000_000).toFixed(1) + ' M';
    } else {
        return balance.toLocaleString(); // To add commas for thousands
    }
};

const LeagueItem = ({ league, completed, onClaim,leagueProgress }) => {
    if (!leagueProgress || !Array.isArray(leagueProgress)) {
        console.error('leagueProgress is undefined or not an array');
        return null; // или верните что-то другое, в зависимости от вашей логики
    }
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
                <span className='gold-style'>{formatBalance(league.reward)}</span>
            </div>
            <button
                className="claim-button blue-style"
                onClick={onClaim}
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
    const isClaimable = referralCount >= requiredReferrals && !xisCompleted;
    return (
        <div
            className={`task-item ${xisCompleted ? 'completed' : ''}${referralCount >= requiredReferrals ? 'done' : ''}`}
            onClick={handleClick}
            style={{pointerEvents: xisCompleted ? 'none' : 'auto', opacity: xisCompleted ? 0.5 : 1}}>
            <img src={image} alt="icon" className="task-icon"/>
            <div className="task-text blue-style">{text}</div>
            <div className="task-reward">
                <img src='./coin.png' alt="coin" className="reward-icon"/>
                <span className='gold-style'>{reward}</span>
            </div>
            <button
                className='claim-button inv blue-style'
                onClick={isClaimable ? onClaim : null}
                disabled={!isClaimable}
                style={{opacity: isClaimable ? 1 : 0.5}}
            >
                Claim
            </button>
        </div>
    );
});


export default Task;
