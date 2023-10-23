import React, { useState, useEffect } from "react";
import UqHeader from "./UqHeader"

type SetPasswordProps = {
  direct: boolean
  pw: string,
  reset: boolean,
  uqName: string,
  setPw: React.Dispatch<React.SetStateAction<string>>,
}

function SetPassword({ uqName, direct, pw, reset, setPw }: SetPasswordProps) {

  let [pw2, setPw2] = useState('');
  let [error, setError] = useState('');

  useEffect(() => {
    setError('')
  }, [pw, pw2])

  const handleSubmit = async (e: any) => {
    e.preventDefault();


    if (pw !== pw2) {
      setError('Passwords do not match');
      return false;
    }

    setTimeout(async () => {
      const result = await fetch('/boot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          password: pw, 
          reset: reset,
          username: uqName,
          direct,
          keyfile: ""
        })
      })

      const base64String = await result.json()

      let blob = new Blob([base64String], {type: "text/plain;charset=utf-8"});
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${uqName}.keyfile`)
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
    <>
    <UqHeader msg="Set Uqbar Node Password" openConnect={()=>{}} />
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
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
      />
      <p style={{color: "red"}}>{error}</p>
      <button type="submit">Submit</button>
    </form>
    </>
  )
}

export default SetPassword;
