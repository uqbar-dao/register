import React, { useState, useEffect } from "react";
import type { Identity } from "../App";
import { useNavigate } from "react-router-dom";

type SetPasswordProps = {
  confirmedUqName: string
}


function SetPassword({ confirmedUqName }: SetPasswordProps) {
  let [password, setPassword] = useState('');
  let [confirmPw, setConfirmPw] = useState('');
  let [direct, setDirect] = useState(false);
  let [error, setError] = useState('');
  let navigate = useNavigate();

  useEffect(() => {
    setError('')
  }, [password, confirmPw])

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (password !== confirmPw) {
      setError('Passwords do not match');
      return false;
    }

    const result = await fetch('/get-ws-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, username: confirmedUqName, direct })
    })

    const interval = setInterval(async () => {
      const homepageResult = await fetch('/') 
      if (homepageResult.status < 400) {
        clearInterval(interval)
        window.location.replace('/')
      }
    }, 2000);

  };

  return (
    <form id="signup-form" className="col" onSubmit={handleSubmit}>
      <div className="row label-row">
        <label htmlFor="password">New Password</label>
        <div className="tooltip-container">
          <div className="tooltip-button">&#8505;</div>
          <div className="tooltip-content">This password will be used to log in if you restart your node or switch browsers.</div>
        </div>
      </div>
      <input
        type="password"
        id="password"
        required
        minLength={6}
        name="password"
        placeholder="Min 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="row label-row">
        <label htmlFor="confirm-password">Confirm Password</label>
      </div>
      <input
        type="password"
        id="confirm-password"
        required minLength={6}
        name="confirm-password"
        placeholder="Min 6 characters"
        value={confirmPw}
        onChange={(e) => setConfirmPw(e.target.value)}
      />
      <p style={{color: "red"}}>{error}</p>
      <label htmlFor="direct">Register as a direct node (only do this if you are hosting your node somewhere stable)</label>
      <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
      <button type="submit">Submit</button>
    </form>
  )
}

export default SetPassword;
