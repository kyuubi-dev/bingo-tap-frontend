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
import NotMobile from './Pages/NotMobile';
import config from './config';

function App() {
    const [userBalance, setUserBalance] = useState(0);
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Получаем обновления через API Telegram
                const updatesResponse = await axios.get(`https://api.telegram.org/bot${config.telegramBotToken}/getUpdates`);
                const updates = updatesResponse.data.result;

                if (updates.length > 0) {
                    const lastUpdate = updates[updates.length - 1];
                    const userId = lastUpdate.message.from.id;
                    const username = lastUpdate.message.from.username;

                    setUserId(userId);

                    // Проверяем существует ли пользователь на нашем сервере
                    const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${userId}`);
                    const userData = checkUserResponse.data;

                    if (userData.userExists) {
                        // Если пользователь существует, загружаем его данные, включая баланс
                        setUserBalance(userData.userBalance);
                    } else {
                        // Если пользователь не существует, создаем нового пользователя
                        const createUserResponse = await axios.post(`${config.apiBaseUrl}/create-user`, {
                            username: username,
                            telegram_id: userId
                        });
                        setUserBalance(0); // Не обязательно устанавливать 0, мы можем получить актуальные данные с сервера
                    }
                }

                setIsLoaded(true);
            } catch (error) {
                console.error('Ошибка при получении данных пользователя:', error);
            }
        };

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
                <Route path="/" element={<Tap telegramId={userId} setUserBalance={setUserBalance} />} />
                <Route path="/team" element={<Team />} />
                <Route path="/task" element={<Task telegramId={userId} />} />
                <Route
                    path="/boost"
                    element={
                        <Boost
                            telegramId={userId}
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
