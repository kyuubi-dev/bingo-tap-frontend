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
    const [userPoints, setUserPoints] = useState(100000);
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const response = await axios.get('https://api.telegram.org/bot7208555837:AAF26oAPtwfVIMfOTnUcGHmZepm5QmD6M00/getMe');
                const telegramId = response.data.result.id;
                const username = response.data.result.username;
                const checkUserResponse = await axios.get(`http://localhost:8000/api/check-user?telegram_id=${telegramId}`);
                const userData = checkUserResponse.data;
                if (userData.userExists) {
                    setUserId(userData.userId);
                    setUserBalance(userData.userBalance);
                } else {
                    const createUserResponse = await axios.post('http://localhost:8000/api/create-user', {
                        username: username,
                        telegram_id: telegramId
                    });
                    const createUserData = createUserResponse.data;
                    setUserId(createUserData.id);
                    setUserBalance(0);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Ошибка при получении данных пользователя:', error);
            }
        };

        fetchUserId();
    }, []);

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <div className="App">
            <BgImage />
            <Navigation />
            <Routes>
                <Route path="/" element={<Tap userId={userId} setUserBalance={setUserBalance} />} />
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
