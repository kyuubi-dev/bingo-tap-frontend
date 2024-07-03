import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Team.css';
import './TextStyle.css';
import config from "../config";

function Team({ userId, botName }) {
    const [copyButtonText, setCopyButtonText] = useState('COPY');
    const [referralBalance, setReferralBalance] = useState(0);
    const [referralCount, setReferralCount] = useState(0);
    const [referrals, setReferrals] = useState([]);

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                // Fetch user's referral balance and count
                const balanceResponse = await axios.get(`${config.apiBaseUrl}/user-ref_balance/${userId}`);
                setReferralBalance(balanceResponse.data.ref_balance);
                
                const countResponse = await axios.get(`${config.apiBaseUrl}/user-referral_count/${userId}`);
                setReferralCount(countResponse.data.referral_count);

                // Fetch user's referrals
                const referralsResponse = await axios.get(`${config.apiBaseUrl}/user-referrals/${userId}`);
                setReferrals(referralsResponse.data.referrals);
            } catch (error) {
                console.error('Error fetching referral data: ', error);
            }
        };

        fetchReferralData();
    }, [userId]);

    const handleCopyClick = () => {
        const inviteLink = `https://t.me/${botName}?start=ref_${userId}`;
        navigator.clipboard.writeText(inviteLink)
            .then(() => {

                setCopyButtonText('COPIED');

                setTimeout(() => {
                    setCopyButtonText('COPY');
                }, 2000);
            })
            .catch(err => {
                console.error('Error copying: ', err);
            });
    };

    const handleClaimClick = async () => {
        try {
            // Get current user balance
            const userBalanceResponse = await axios.get(`${config.apiBaseUrl}/user-balance/${userId}`);
            const currentBalance = userBalanceResponse.data.balance;
    
            // Calculate new balance
            const newBalance = currentBalance + referralBalance;
    
            // Update user balance
            await axios.put(`${config.apiBaseUrl}/save-balance/${userId}`, { balance: newBalance });
    
            // Reset referral balance in the database
            await axios.put(`${config.apiBaseUrl}/save-ref_balance/${userId}`, { ref_balance: 0 });
    
            // Reset referral balance in the state
            setReferralBalance(0);
        } catch (error) {
            console.error('Error claiming referral balance: ', error);
        }
    };
    
    const inviteLink = `https://t.me/${botName}?start=ref_${userId}`;

    return (
        <div className="Team">
            <div className='lightnings f-tab'>
                <img src='/16.png' className='lightning f-tab right' alt="Lightning Right"/>
                <img src='/17.png' className='lightning f-tab left' alt="Lightning Left"/>
            </div>
            <div className="Header">
                <div className='Referral'>
                    <span className="referral-count blue-style">{referralCount}</span>
                    <div className='ref-text blue-style'>REFERRALS</div>
                </div>
            </div>
            <div className="referral-total-container">
                <div className="referral-total blue-style">
                <button className="copy-button blue-style" onClick={handleClaimClick}>CLAIM</button>
                {`+${referralBalance}`}
                </div>
            </div>


            <div className="Invite-link">
                <div className="invite-text blue-style">MY INVITE LINK:</div>
                <a href={inviteLink} className="invite-url">{inviteLink}</a>
                <button className="copy-button blue-style" onClick={handleCopyClick}>{copyButtonText}</button>
            </div>
            <div className="Team-section">
                <div className="team-header blue-style">MY TEAM:</div>
                {/* <div className='teams'>
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
                </div> */}
                <div className='teams'>
                    {referrals.map((referral, index) => (
                        <TeamItem
                            key={index}
                            name={`${referral}`}
                            balance="10 000"
                            leagua="Gold" 
                            bonus="50 000"
                        />
                    ))}
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
