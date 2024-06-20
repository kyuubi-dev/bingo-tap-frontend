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
    const [telegramId, setTelegramId] = useState(null);
    const [loadingImages, setLoadingImages] = useState(true);
    const location = useLocation();

    const imageSources = {
        '/': ['./robot.png', './coin.png','/16.png', '/17.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png','./boost/power.png','./tasks/open.png'],
        '/task': ['/16.png', '/17.png','/coin.png','./tasks/open.png','./tasks/people1.png','./tasks/people2.png','./tasks/people3.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png'],
        '/boost': ['/16.png', '/17.png','/coin.png','/boost/fire.b.png','/boost/power.png']
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('https://api.telegram.org/bot7208555837:AAF26oAPtwfVIMfOTnUcGHmZepm5QmD6M00/getMe');
                const telegramId = response.data.result.id;
                const username = response.data.result.username;
                setTelegramId(telegramId);

                const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${telegramId}`);
                const userData = checkUserResponse.data;

                if (userData.userExists) {
                } else {
                    await axios.post(`${config.apiBaseUrl}/create-user`, {
                        username: username,
                        telegram_id: telegramId
                    });
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
