import React from "react";
import "./Stat.css";

const Stat = () => {

    return(
        <h1 className="Stat">
            <div className="bg-image"/>
            <div className="statistics-content">
          <div className="stat-item">
            <div className="stat-text">
              <div className="stat-title">TOTAL SHARE BALANCE:</div>
              <div className="shared-balance">
              <img src='./coin.png' alt="coin" className="shared-balance-icon" />
                <span className="team-header">82.315 T</span>
                </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-title">TOTAL PLAYERS:</div>
            <div className="team-header">356 021</div>
          </div>
          <div className="stat-item">
            <div className="stat-title">DAILY USERS:</div>
            <div className="team-header">286 567</div>
          </div>
          <div className="stat-item">
            <div className="stat-title">ONLINE USERS:</div>
            <div className="team-header">35 944</div>
          </div>
        </div>
        </h1>
    );
}

export default Stat;