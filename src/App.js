import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Tap from './Pages/Tap';
import BgImage from './Pages/BgImage';
import Team from './Pages/Team';
import Navigation from './Pages/Navigation';
import Task from './Pages/Task';
import Boost from './Pages/Boost';
import LoadingScreen from './Pages/LoadingScreen';
import Stat from './Pages/Stat';

function App() {
    const [userBalance, setUserBalance] = useState(0);
    const [userPoints, setUserPoints] = useState(100000); // Initial points
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState(null);

    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });

    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await fetch('/api/check-user', { method: 'GET' });
                const data = await response.json();
                if (data.userExists) {
                    setUserId(data.userId);
                    setUserBalance(data.userBalance);
                } else {
                    const createUserResponse = await fetch('/api/create-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: 'TelegramUser',  // Replace with actual username if available
                            telegram_id: 'TelegramId'  // Replace with actual Telegram ID if available
                        })
                    });
                    const createUserData = await createUserResponse.json();
                    setUserId(createUserData.id);
                    setUserBalance(0);  // New user starts with 0 balance
                }
            } catch (error) {
                console.error('Error checking or creating user:', error);
            }
        };

        const loadResources = async () => {
            const images = [
                '/coin.png',
                '/ranks/gold.png',
                './ranks/blue.png',
                './ranks/neon.png',
                './ranks/green.png',
                './tasks/task.png',
                './tasks/open.png',
                './tasks/people1.png',
                './tasks/people2.png',
                './tasks/people3.png',
                './boost/power.png',
                './btns/robotv2.png',
                './boost/click.png',
                './boost/dow.png',
                './boost/fire.b.png',
                './boost/fire.p.png',
                './btns/boost.png',
                './btns/boost_active.png',
                './btns/stat.png',
                './btns/stat_active.png',
                './btns/tap.png',
                './btns/tap_active.png',
                './btns/task.png',
                './btns/task_active.png',
                './btns/team.png',
                './btns/team_active.png',
                './16.png',
                './17.png',
                './bg.png',
                './btn-bg.png',
                './coin.png'
            ];

            const promises = images.map((src) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = resolve;
                    img.onerror = reject;
                });
            });

            try {
                await Promise.all(promises);
                await checkUser();  // Check and create user if not exists
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading resources:', error);
            }
        };

        loadResources();
    }, []);

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <div className="App">
            <BgImage />
            <BrowserRouter>
                <Navigation />
                <Routes>
                    <Route path="/" element={<Tap setUserBalance={setUserBalance} />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/task" element={<Task userBalance={userBalance} />} />
                    <Route
                        path="/boost"
                        element={
                            <Boost
                                userPoints={userPoints}
                                setUserPoints={setUserPoints}
                                purchasedBoosts={purchasedBoosts}
                                setPurchasedBoosts={setPurchasedBoosts}
                            />
                        }
                    />
                    <Route path='/stat' element={<Stat />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
