import React, { useState, useEffect } from "react";

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
    <div id="signup-form-header" className="row">
      <img alt="icon" style={{margin: "0 1em 0.2em 0"}} src="data:image/vnd.microsoft.icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP/x////AP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/4xwJ////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACmE/7MqhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+N4hJ////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AK4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/9twjHf///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//////8A////AP///wD///8A////ACqE//8qhP/D////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CCx////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP////8A////ACqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wAqhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwfyyqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP//Lob7wPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE//8thvvL+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53B/7AKr/AyqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//////wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT/kf///wD///8A////AP///wD///8AKoT//yqE//////8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP7///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT/3SqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//rcIL3///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg9////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAKr/AyqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//Z////mff/+Znx//mZ8P/pmfB/yZnwP8mZ8B/JmfAPyZnwDsm+cAbJ/jAGyf4QBMn+AADL/gAAy/4AAMv+AADL/gAAy/4AAMv+AADJ/gAAyf4QBsn+MAbJvnAHyZnwD8mZ8A/JmfAfyZnwP+mZ8H/5mfD/+Znx//+Z9///mf/8=" />
      <h1 style={{textAlign: "center"}}>Reset Uqbar Node</h1>
    </div>
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
