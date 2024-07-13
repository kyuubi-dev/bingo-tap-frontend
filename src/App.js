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
import ReconnectingWebSocket from 'reconnecting-websocket';
function App() {
    const [purchasedBoosts, setPurchasedBoosts] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState(null);
    const [botName, setBotName] = useState(null);
    const [isMobile, setIsMobile] = useState(true);
    const [loadingImages, setLoadingImages] = useState(true);
    const location = useLocation();
    const ws = useRef(null);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const imageSources = {
        '/': ['./btns/robotv2.png','./btns/1.png','./btns/2.png', './coin.png', '/16.png', '/17.png', './ranks/blue.png', './ranks/gold.png', './ranks/neon.png', './ranks/green.png', './boost/power.png', './tasks/open.png', "./btns/robot-boost.png",'./ranks/master.png','./ranks/wood.png','./ranks/grandmaster.png','./ranks/bronze.png'],
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
                const botName = "mantis_tap_bot";
                
                const urlParams = new URLSearchParams(window.location.search);
                const refererId = urlParams.get('r');

                console.log('Referer ID:', refererId);
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
                const user = initializeTelegramWebApp();
                if (user) {
                    const { id, username } = user;

                    const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${id}`);
                    const userData = checkUserResponse.data;

                    if (userData.userExists) {
                    } else {
                        // Очистка локального хранилища для новых пользователей
                        localStorage.clear();
                        await axios.post(`${config.apiBaseUrl}/create-user`, {
                            username: username,
                            telegram_id: id
                        });
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
        const loadImage = async (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = resolve;
                img.onerror = reject;
            });
        };

        const loadImagesForRoute = async (route) => {
            const sources = imageSources[route] || [];
            try {
                await Promise.all(sources.map(loadImage));
                setLoadingImages(false);
            } catch (error) {
                console.error('Error loading images:', error);
                setLoadingImages(false);
            }
        };

        setLoadingImages(true);
        loadImagesForRoute(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        // Отключаем скроллинг и клики
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-click');

        // Возвращаем начальное состояние при размонтировании компонента
        return () => {
            document.body.style.overflow = 'auto';
            document.body.classList.remove('no-click');
        };
    }, []);
    
    useEffect(() => {
        const url = `${config.wsBaseUrl}`;
        ws.current = new ReconnectingWebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error', error);
        };

        const handleUnload = () => {
            if (ws.current) {
                ws.current.close();
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    if (!isLoaded || loadingImages) {
        return <LoadingScreen />;
    }

    if (!isMobile) {
        return <NotMobile />;
    }

        return (
            <div className="App">
                <BgImage />
                <Navigation telegramId={userId}  showBoostModal={showBoostModal}/>
                <Routes>
                    <Route path="/" element={<Tap telegramId={userId} ws={ws.current}   setShowBoostModal={setShowBoostModal} />} />
                    <Route path="/team" element={<Team userId={userId} botName={botName} />} />
                    <Route path="/task" element={<Task telegramId={userId} ws={ws.current} />} />
                    <Route
                        path="/boost"
                        element={
                            <Boost
                                telegramId={userId}
                                purchasedBoosts={purchasedBoosts}
                                setPurchasedBoosts={setPurchasedBoosts}
                                ws={ws.current}
                            />
                        }
                    />
                    <Route path='/stat' element={<Stat telegramId={userId}/>} />
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
