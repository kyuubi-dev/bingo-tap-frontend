import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./Stat.css";
import config from "../config";
import LoadingScreen from "./LoadingScreen";
const Stat = () => {
    const [stats, setStats] = useState({
        totalShareBalance: 0,
        totalPlayers: 0,
        dailyPlayers: 0,
        onlinePlayers: 0
    });
    const [isLoading,setIsLoading]=useState(false);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/stats`);
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        setIsLoading(true)
        fetchStats();
    }, []);

    if (!isLoading) {
        return <LoadingScreen />;
    }

    return(
        <h1 className="Stat">
            <div className='lightnings'>
                <img src='/16.png' className='lightning f-tab right' alt="Lightning Right"/>
                <img src='/17.png' className='lightning f-tab left' alt="Lightning Left"/>
            </div>
            <div className="statistics-content">
                <div className="stat-item">
                    <div className="stat-text">
                        <div className="stat-title gold-style">TOTAL SHARE BALANCE:</div>
                        <div className="shared-balance">
                            <img src='./coin.png' alt="coin" className="shared-balance-icon"/>
                            <span className="team-header stat blue-style">{stats.totalShareBalance}</span>
                        </div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">TOTAL PLAYERS:</div>
                    <div className="team-header blue-style">{stats.totalPlayers}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">DAILY USERS:</div>
                    <div className="team-header blue-style">{stats.dailyPlayers}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">ONLINE USERS:</div>
                    <div className="team-header blue-style"> {stats.onlinePlayers}</div>
                </div>
            </div>
        </h1>
    );
}

export default Stat;