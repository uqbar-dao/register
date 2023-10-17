import React, { useState, useEffect } from "react";
import type { Identity } from "../App";
import { useNavigate } from "react-router-dom";

type SetPasswordProps = {
  confirmedUqName: string,
  direct: boolean
}


function SetPassword({ confirmedUqName, direct }: SetPasswordProps) {
  let [password, setPassword] = useState('');
  let [confirmPw, setConfirmPw] = useState('');
  let [error, setError] = useState('');

  useEffect(() => {
    setError('')
  }, [password, confirmPw])

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (password !== confirmPw) {
      setError('Passwords do not match');
      return false;
    }

    setTimeout(async () => {
      const result = await fetch('/boot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          password, 
          username: confirmedUqName,
          direct,
          keyfile: ""
        })
      })

      const base64String = await result.json()

      let blob = new Blob([base64String], {type: "text/plain;charset=utf-8"});
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${confirmedUqName}.keyfile`)
      document.body.appendChild(link);
      link.click();

      const interval = setInterval(async () => {
        const homepageResult = await fetch('/') 
        if (homepageResult.status < 400) {
          clearInterval(interval)
          window.location.replace('/')
        }
      }, 2000);

    }, 500)
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
      <button type="submit">Submit</button>
    </form>
  )
}

export default SetPassword;
