import React, { useState } from "react";

function SetPassword() {
  let [pw, setPw] = useState('');
  let [confirmPw, setConfirmPw] = useState('');


  return (
    <form id="signup-form" className="col">
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
        value={pw}
        onChange={(e) => setPw(e.target.value)}
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
      <label htmlFor="direct">Register as a direct node (only do this if you are hosting your node somewhere stable)</label>
      <input type="checkbox" id="direct" name="direct" />
      <button type="submit">Sign & Submit</button>
    </form>
  )
}

export default SetPassword;
