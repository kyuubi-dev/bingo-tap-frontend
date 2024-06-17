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

function App() {
    const [userBalance, setUserBalance] = useState(0);
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [telegramId, setTelegramId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Получаем telegramId через API Telegram
                const response = await axios.get('https://api.telegram.org/bot7208555837:AAF26oAPtwfVIMfOTnUcGHmZepm5QmD6M00/getMe');
                const telegramId = response.data.result.id;
                const username = response.data.result.username;
                setTelegramId(telegramId);

                // Проверяем существует ли пользователь на нашем сервере
                const checkUserResponse = await axios.get(`http://localhost:8000/api/check-user?telegram_id=${telegramId}`);
                const userData = checkUserResponse.data;

                if (userData.userExists) {
                    // Если пользователь существует, загружаем его данные, включая баланс
                    setUserBalance(userData.userBalance);
                } else {
                    // Если пользователь не существует, создаем нового пользователя
                    const createUserResponse = await axios.post('http://localhost:8000/api/create-user', {
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
