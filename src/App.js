import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Tap from './Pages/Tap';
import BgImage from './Pages/BgImage';
import Team from './Pages/Team';
import Navigation from './Pages/Navigation';
import Task from './Pages/Task';
import Boost from './Pages/Boost';
import LoadingScreen from './Pages/LoadingScreen';
import Stat from './Pages/Stat';
import config from './config';


function App() {
    const [userBalance, setUserBalance] = useState(0);
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [telegramId, setTelegramId] = useState(null);
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    useEffect(() => {
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
        }
        const fetchUserData = async () => {
            try {
                // Получаем telegramId через API Telegram
                const response = await axios.get('https://api.telegram.org/bot7208555837:AAF26oAPtwfVIMfOTnUcGHmZepm5QmD6M00/getMe');
                const telegramId = response.data.result.id;
                const username = response.data.result.username;
                setTelegramId(telegramId);

                // Проверяем существует ли пользователь на нашем сервере
                const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${telegramId}`);
                const userData = checkUserResponse.data;

                if (userData.userExists) {
                    // Если пользователь существует, загружаем его данные, включая баланс
                    setUserBalance(userData.userBalance);
                } else {
                    // Если пользователь не существует, создаем нового пользователя
                    const createUserResponse = await axios.post(`${config.apiBaseUrl}/create-user`, {
                        username: username,
                        telegram_id: telegramId
                    });
                    setUserBalance(0); // Не обязательно устанавливать 0, мы можем получить актуальные данные с сервера
                }

                setIsLoaded(true);
            } catch (error) {
                console.error('Ошибка при получении данных пользователя:', error);
            }
        };
        loadResources();
        fetchUserData();
    }, []);

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <div className="App">
            <BgImage />
            <Navigation />
            <Routes>
                <Route path="/" element={<Tap telegramId={telegramId} setUserBalance={setUserBalance} />} />
                <Route path="/team" element={<Team />} />
                <Route path="/task" element={<Task telegramId={telegramId}  />} />
                <Route
                    path="/boost"
                    element={
                        <Boost
                            telegramId={telegramId}
                            purchasedBoosts={purchasedBoosts}
                            setPurchasedBoosts={setPurchasedBoosts}
                        />
                    }
                />
                <Route path='/stat' element={<Stat />} />
            </Routes>
        </div>
    );
}

function AppWrapper() {
    return (
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}

export default AppWrapper;
