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
    const [username, setUsername] = useState(null);
    const [isMobile, setIsMobile] = useState(true);

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
                    const checkUserResponse = await axios.get(`${config.apiBaseUrl}/check-user?telegram_id=${id}`);
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

    if (!isLoaded) {
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
