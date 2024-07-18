import React, { useEffect, useState } from 'react';
import leagues from './leaguaData';
import './RequiredLeagues.css';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import config from "../config";
const LeagueProgress = ({ telegramId, ws }) => {
    const [userData, setUserData] = useState({});
    const [currentLeagueIndex, setCurrentLeagueIndex] = useState(0);
    const [userLeague, setUserLeague] = useState(null);
    const [userBalance, setUserBalance] = useState(null);
    const navigate = useNavigate();

    const initializeUserData = async () => {
        const cachedUserBalance = localStorage.getItem('userBalance');
        const cachedTapingUserBalance = localStorage.getItem('userTapingBalance');
        const energy = localStorage.getItem('energy');
        console.log('Cached user balance:', cachedUserBalance);
        console.log('CachedTaping user balance:', cachedTapingUserBalance);
        if (cachedUserBalance !== null) {
            setUserBalance(parseInt(cachedUserBalance, 10));
        } else {
            setUserBalance(0);
        }
        if (cachedUserBalance) {
            setUserBalance(parseInt(cachedUserBalance, 10));
        }

        try {
            await axios.put(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
                newEnergy: parseInt(energy, 10)
            });
            await axios.put(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
                taping_balance: parseInt(cachedTapingUserBalance, 10)
            });
            await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                total_balance: parseInt(cachedUserBalance, 10)
            });

            // Після збереження даних відкриваємо WebSocket
        } catch (error) {
            console.error("Error saving balance:", error);
        }
    };


    useEffect(() => {
        initializeUserData();
        ws.send(JSON.stringify({ type: 'requestUserData', telegram_id: telegramId }));

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data from server:', data);

            if (data.type === 'userData') {
                setUserData(data);
                if (data.league != null) setUserLeague(data.league);
            }
        };
    }, [telegramId, ws]);

    const { leagueProgress } = userData;
    const currentLeague = leagues[currentLeagueIndex];
    const previousLeague = leagues[currentLeagueIndex - 1] || { requiredPoints: 0 }; // Get the previous league or set to 0 if first
    const progressData = leagueProgress?.find(item => item.league === currentLeague.name);
    const progress = progressData ? progressData.progress : 0;

    const currentProgress = Math.max(0, progress - previousLeague.requiredPoints);
    const requiredPointsForCurrentLeague = currentLeague.requiredPoints ;



    const handleNextClick = () => {
        if (currentLeagueIndex < leagues.length - 1) {
            setCurrentLeagueIndex(currentLeagueIndex + 1);
        }
    };

    const handlePrevClick = () => {
        if (currentLeagueIndex > 0) {
            setCurrentLeagueIndex(currentLeagueIndex - 1);
        }
    };
    const formatBalance = (balance) => {
        if (balance === null || balance === undefined) {
            return '0';
        }

        if (balance >= 1_000_000_000) {
            return (balance / 1_000_000_000).toFixed(1) + ' B';
        } else if (balance >= 1_000_000) {
            return (balance / 1_000_000).toFixed(1) + ' M';
        } else {
            return balance.toLocaleString(); // To add commas for thousands
        }
    };
    const userLeagueIndex = leagues.findIndex(league => league.name === userLeague);
    const nextUserLeagueIndex = userLeagueIndex + 1;

    return (
        <div className="league-container">
            <h2 className="gold-style currentLeaguestyle">{currentLeague.name} LEAGUE</h2>
            <img
                key={currentLeague.img}
                src={currentLeague.img}
                alt={`${currentLeague.name} League`}
                className="league-image"
            />
            <p className="white-style league-description">Your number of clicks determines the league you enter.</p>
            <div className="progress-bar-container">
                <div className="progress-bar"
                     style={{width: `${progress}%`}}></div>
            </div>
            <p className=" progress-bar-balance-display">
                {currentLeagueIndex === nextUserLeagueIndex ? `${formatBalance(userBalance)} / ${formatBalance(requiredPointsForCurrentLeague)}` : `From ${formatBalance(requiredPointsForCurrentLeague)} `}
            </p>
            <div className="navigation-buttons">
                <button onClick={handlePrevClick} disabled={currentLeagueIndex === 0}
                        className="nav-button prev-button">
                    <img src="./btns/left.png"/>
                </button>
                <button onClick={handleNextClick} disabled={currentLeagueIndex === leagues.length - 1}
                        className="nav-button next-button">
                    <img src="./btns/next.png" className=" next-button-img"/>
                </button>
            </div>
        </div>
    );
};

export default LeagueProgress;
