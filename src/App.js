import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
    const [userId, setUserId] = useState(874423521);
    const [username, setUsername] = useState(null);
    const [botName, setBotName] = useState(null);
    const [isMobile, setIsMobile] = useState(true);
    const [loadingImages, setLoadingImages] = useState(true);
    const location = useLocation();
    const ws = useRef(null);

    const imageSources = {
        '/': ['./btns/robotv2.png', './coin.png', '/16.png', '/17.png', './ranks/blue.png', './ranks/gold.png', './ranks/neon.png', './ranks/green.png', './boost/power.png', './tasks/open.png'],
        '/task': ['/16.png', '/17.png', '/coin.png', './tasks/open.png', './tasks/people1.png', './tasks/people2.png', './tasks/people3.png', './ranks/blue.png', './ranks/gold.png', './ranks/neon.png', './ranks/green.png','./ranks/master.png','./ranks/wood.png','./ranks/grandmaster.png','./ranks/bronze.png'],
        '/boost': ['/16.png', '/17.png', '/coin.png', '/boost/fire.b.png', '/boost/power.png']
    };

    useEffect(() => {
        const checkIfMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            if (/android/i.test(userAgent)) {
                return true;
            }
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                return true;
            }
            return false;
        };

        setIsMobile(checkIfMobile());

        const initializeTelegramWebApp = () => {
            if (window.Telegram && window.Telegram.WebApp) {
                const webAppData = window.Telegram.WebApp.initDataUnsafe;
                const user = webAppData.user;
                const botName = "Bingo_kyuubi_test_bot";

                if (user) {
                    const { id, username } = user;
                    setUserId(id);
                    setUsername(username);
                    setBotName(botName);
                    return { id, username, botName };
                }
            }
            return null;
        };

        const fetchUserData = async () => {
            try {
                const user = {id:874423521,username:"bogdan_krvsk"};
                if (user) {
                    const { id, username } = user;

                    const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${id}`);
                    const userData = checkUserResponse.data;

                    if (userData.userExists) {
                        setUserBalance(userData.userBalance);
                    } else {
                        await axios.post(`${config.apiBaseUrl}/create-user`, {
                            username: username,
                            telegram_id: id
                        });
                        setUserBalance(0);
                    }
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Error fetching user data:', error);
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

    const handleBalanceChange = (newBalance,newEnergy) => {
        setUserBalance(newBalance);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'updateBalance',
                telegram_id: 874423521,
                newBalance: 1000,
                newEnergy: newEnergy
            }));
        }
    };

    if (!isLoaded || loadingImages) {
        return <LoadingScreen />;
    }

    if (!isMobile) {
        return <NotMobile />;
    }

    return (
        <div className="App">
            <BgImage />
            <Navigation />
            <Routes>
                <Route path="/" element={<Tap telegramId={userId} onBalanceChange={handleBalanceChange} />} />
                <Route path="/team" element={<Team userId={userId} botName={botName} />} />
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
