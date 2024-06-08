import React, { useState } from 'react';
import './Team.css';
import './TextStyle.css';

function Team() {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopyClick = () => {
        const inviteLink = 'https://t.me/bng_bot?start=749626634';
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setCopySuccess('Посилання скопійовано!');
                setTimeout(() => {
                    setCopySuccess('');
                }, 2000);
            })
            .catch(err => {
                console.error('Помилка копіювання: ', err);
            });
    };

    return (
        <div className="Team">
            <div className="bg-image" />
            <div className="Header">
                <div className='Referral'>
                    <span className="referral-count blue-style">2</span>
                    <div className='ref-text blue-style'>REFERRALS</div>
                </div>
            </div>
            <div className="referral-total blue-style">+100 000</div>
            <div className="Invite-link">
                <div className="invite-text blue-style">MY INVITE LINK:</div>
                <a href="https://t.me/bng_bot?start=749626634" className="invite-url">https://t.me/bng_bot?start=749626634</a>
                <button className="copy-button blue-style" onClick={handleCopyClick}>COPY</button>
            </div>
            {copySuccess && <div className="copy-message blue-style">{copySuccess}</div>}
            <div className="Team-section">
                <div className="team-header blue-style">MY TEAM:</div>
                <div className='teams'>
                    <TeamItem
                        name="George Vladi"
                        balance="10 000"
                        leagua="Gold"
                        bonus="50 000"
                    />
                    <TeamItem
                        name="George Vladi"
                        balance="10 000"
                        leagua="Gold"
                        bonus="50 000"
                    />
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

const TeamItem = ({ name, balance, leagua, bonus }) => (
    <div className="team-member">
        <span className="name default-style">{name}</span>
        <div className='stat-inf'>
            <div className='Rank'>
                <img src='./ranks/gold.png' className='rank-img' />
                <span className="rank-text gold-style">{leagua}</span>
            </div>
            <div className='Point'>
                <img src="/coin.png" alt="Coin" className="coin-icon" />
                <span className="points blue-style">{balance}</span>
            </div>
        </div>
        <span className="bonus gold-style">+{bonus}</span>
    </div>
);

export default Team;
