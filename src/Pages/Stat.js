import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./Stat.css";
import config from "../config";
import LoadingScreen from "./LoadingScreen";
const Stat = ({telegramId}) => {
    const [stats, setStats] = useState({
        totalShareBalance: 0,
        totalPlayers: 0,
        dailyPlayers: 0,
        onlinePlayers: 0
    });
    const [isLoading,setIsLoading]=useState(false);
    useEffect(() => {
        const initializeUserData = async () => {
            const cachedUserBalance = localStorage.getItem('userBalance');
            const cachedTapingUserBalance = localStorage.getItem('userTapingBalance');
            const energy = localStorage.getItem('energy');
            await axios.put(`${config.apiBaseUrl}/save-energy/${telegramId}`, {
                newEnergy: parseInt(energy, 10)
            });
            await axios.put(`${config.apiBaseUrl}/save-tapingBalance/${telegramId}`, {
                taping_balance: cachedTapingUserBalance
            });
            await axios.put(`${config.apiBaseUrl}/save-totalBalance/${telegramId}`, {
                total_balance: cachedUserBalance
            });
        };
        initializeUserData();
    },[]);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/stats`);
                setStats(response.data);
                setIsLoading(true)
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, []);

    if (!isLoading) {
        return <LoadingScreen />;
    }
    const formatBalance = (balance) => {
        if (balance >= 1_000_000_000) {
            return (balance / 1_000_000_000).toFixed(1) + ' B';
        } else if (balance >= 1_000_000) {
            return (balance / 1_000_000).toFixed(1) + ' M';
        } else {
            return balance.toLocaleString(); // To add commas for thousands
        }
    };
    return(
        <h1 className="Stat">
            <div className="statistics-content">
                <div className="stat-item">
                    <div className="stat-text">
                        <div className="stat-title gold-style">TOTAL SHARE BALANCE:</div>
                        <div className="shared-balance">
                            <img src='./coin.png' alt="coin" className="shared-balance-icon"/>
                            <span className="team-header stat blue-style">{formatBalance(stats.totalShareBalance)}</span>
                        </div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">TOTAL PLAYERS:</div>
                    <div className="team-header blue-style">{formatBalance(stats.totalPlayers + 10000)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">DAILY USERS:</div>
                    <div className="team-header blue-style">{formatBalance(stats.dailyPlayers)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">ONLINE USERS:</div>
                    <div className="team-header blue-style"> {formatBalance(stats.onlinePlayers)}</div>
                </div>
            </div>
        </h1>
    );
}

export default Stat;