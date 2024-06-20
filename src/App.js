import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    
    const [loadingImages, setLoadingImages] = useState(true);
    const location = useLocation();

    const imageSources = {
        '/': ['./robot.png', './coin.png','/16.png', '/17.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png','./boost/power.png','./tasks/open.png'],
        '/task': ['/16.png', '/17.png','/coin.png','./tasks/open.png','./tasks/people1.png','./tasks/people2.png','./tasks/people3.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png'],
        '/boost': ['/16.png', '/17.png','/coin.png','/boost/fire.b.png','/boost/power.png']
    };
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
                setIsLoaded(true); // Allow the app to render despite the error
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        setLoadingImages(true);

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = resolve;
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    reject();
                };
            });
        };

        const loadImagesForRoute = async (route) => {
            const sources = imageSources[route] || [];
            try {
                await Promise.all(sources.map(src => loadImage(src)));
                setLoadingImages(false);
            } catch (error) {
                console.error('Error loading images:', error);
                setLoadingImages(false);
            }
        };

        loadImagesForRoute(location.pathname);
    }, [location.pathname]);

    if (!isLoaded || loadingImages) {
        return <LoadingScreen />;
    }

    return (
        <div className="App">
            <BgImage />
            <Navigation />
            <Routes>

                <Route path="/" element={<Tap telegramId={telegramId} />} />
                <Route path="/team" element={<Team />} />
                <Route path="/task" element={<Task telegramId={telegramId} />} />
                <Route path="/boost" element={<Boost telegramId={telegramId}
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
