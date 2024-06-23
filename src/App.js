import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route,useLocation  } from 'react-router-dom';
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
    const [username, setUsername] = useState(null);
    const [isMobile, setIsMobile] = useState(true);
    const [loadingImages, setLoadingImages] = useState(true);
    const location = useLocation();

    const imageSources = {
        '/': ['./robot.png', './coin.png','/16.png', '/17.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png','./boost/power.png','./tasks/open.png'],
        '/task': ['/16.png', '/17.png','/coin.png','./tasks/open.png','./tasks/people1.png','./tasks/people2.png','./tasks/people3.png','./ranks/blue.png','./ranks/gold.png','./ranks/neon.png','./ranks/green.png'],
        '/boost': ['/16.png', '/17.png','/coin.png','/boost/fire.b.png','/boost/power.png']
    };

  

    useEffect(() => {
        const checkIfMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            // Check for Android
            if (/android/i.test(userAgent)) {
                return true;
            }
            // Check for iOS
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                return true;
            }
            return false;
        };

        setIsMobile(checkIfMobile());

        const initializeTelegramWebApp = () => {
            if (window.Telegram && window.Telegram.WebApp) {
                const webAppUser = window.Telegram.WebApp.initDataUnsafe.user;
                if (webAppUser) {
                    const { id, username } = webAppUser;
                    setUserId(id);
                    setUsername(username);
                    return { id, username };
                }
            }
            return null;
        };



        const fetchUserData = async () => {
            try {
                const user = initializeTelegramWebApp();
                if (user) {
                    const { id, username } = user;

                    // Check if user exists on the server
                    const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${874423521}`);
                    const userData = checkUserResponse.data;

                    if (userData.userExists) {
                        // If user exists, load their data, including balance
                        setUserBalance(userData.userBalance);
                    } else {
                        // If user does not exist, create a new user
                        await axios.post(`${config.apiBaseUrl}/create-user`, {
                            username: username,
                            telegram_id: id
                        });
                        setUserBalance(0); // Optionally set 0, or get actual data from the server
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
                <Route path="/" element={<Tap telegramId={userId} />} />
                <Route path="/team" element={<Team userId={userId} />} />
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
