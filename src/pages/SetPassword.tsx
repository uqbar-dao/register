import React, { useState, useEffect, FormEvent, useCallback } from "react";
import UqHeader from "../components/UqHeader"
import Loader from "../components/Loader";
import { downloadKeyfile } from "../utils/download-keyfile";

type SetPasswordProps = {
  direct: boolean
  pw: string,
  reset: boolean,
  uqName: string,
  setPw: React.Dispatch<React.SetStateAction<string>>,
  appSizeOnLoad: number
  closeConnect: () => void
}

function SetPassword({ uqName, direct, pw, reset, setPw, appSizeOnLoad, closeConnect }: SetPasswordProps) {
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Set Password"
  }, [])

  useEffect(() => {
    setError('')
  }, [pw, pw2])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (pw !== pw2) {
      setError('Passwords do not match');
      return false;
    }

    setTimeout(async () => {
      setLoading(true);

      try {
        const result = await fetch('/boot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            password: pw,
            reset,
            username: uqName,
            direct,
          })
        })

        const base64String = await result.json()

        downloadKeyfile(uqName, base64String)

        const interval = setInterval(async () => {
          const res = await fetch("/");
          if (Number(res.headers.get('content-length')) !== appSizeOnLoad) {
            clearInterval(interval);
            window.location.replace("/");
          }
        }, 2000);
      } catch {
        alert('There was an error setting your password, please try again.')
        setLoading(false);
      }
    }, 500)
  }, [appSizeOnLoad, direct, pw, pw2, reset, uqName]);

  return (
    <>
      <UqHeader msg="Set Uqbar Node Password" openConnect={()=>{}} closeConnect={closeConnect} />
      {loading ? (
        <Loader msg="Setting up node..." />
      ) : (

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
            autoFocus
          />
          <div className="row label-row">
            <label htmlFor="confirm-password">Confirm Password</label>
          </div>
          <input
            type="password"
            id="confirm-password"
            required
            minLength={6}
            name="confirm-password"
            placeholder="Min 6 characters"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
          {Boolean(error) && <p style={{color: "red"}}>{error}</p>}
          <button type="submit">Submit</button>
        </form>
      )}
    </>
  )
}

export default SetPassword;
