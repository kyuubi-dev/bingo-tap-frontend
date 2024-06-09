import React from "react";
import "./Stat.css";

const Stat = () => {

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
                            <span className="team-header stat blue-style">82.315 T</span>
                        </div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">TOTAL PLAYERS:</div>
                    <div className="team-header blue-style">356 021</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">DAILY USERS:</div>
                    <div className="team-header blue-style">286 567</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title gold-style">ONLINE USERS:</div>
                    <div className="team-header blue-style">35 944</div>
                </div>
            </div>
        </h1>
    );
}

export default Stat;