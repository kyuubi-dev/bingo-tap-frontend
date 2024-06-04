import React from 'react';
import './Team.css';

function Team() {
  return (
    <div className="Team">
      <div className="bg-image" />
      <div className="Header">
        <div className='Referral'>
        <span className="referral-count">2</span>
        <div  className='ref-text'> REFERRALS</div>
        </div>
      </div>
      <div className="referral-total">+100 000</div>
      <div className="Invite-link">
            <div className="invite-text">MY INVITE LINK:</div>
            <a href="https://t.me/bng_bot?start=749626634" className="invite-url">https://t.me/bng_bot?start=749626634</a>
            <button className="copy-button">COPY</button>
      </div>
      <div className="Team-section">
        <div className="team-header">MY TEAM:</div>
      <div className='teams'>
        <TeamItem 
        name="George Vladi"
        balance="10 000"
        leagua="Gold"
        bonus="50 000"
        />
        
      </div>
      </div>
    </div>
  );
}

const TeamItem =({ name, balance,leagua,bonus}) => (
        <div className="team-member">
          <span className="name">{name}</span>
          <div className='stat-inf'>
          <div className='Rank'>
          <img src='./ranks/gold.png' className='rank-img'/>
          <span className="rank-text">{leagua}</span>
          </div>
          <div className='Point'>
          <img src="/coin.png" alt="Coin" className="coin-icon" />
          <span className="points">{balance}</span>
          </div>
          </div>
          <span className="bonus" >+{bonus}</span>

       </div>
);

export default Team;
