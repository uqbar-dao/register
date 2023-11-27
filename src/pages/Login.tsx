import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";

import UqHeader from "../components/UqHeader";
import { PageProps } from "../lib/types";
import Loader from "../components/Loader";

interface LoginProps extends PageProps {

}

function Login({
  direct,
  pw,
  uqName,
  setDirect,
  setPw,
  setUqName,
  qns,
  openConnect,
  appSizeOnLoad,
  ipAddress,
  closeConnect,
}: LoginProps) {
  const navigate = useNavigate();

  const [keyErrs, setKeyErrs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const KEY_WRONG_NET_KEY = "Keyfile does not match public key";
  const KEY_WRONG_IP = "IP Address does not match records";

  // for if we check router validity in future
  // const KEY_BAD_ROUTERS = "Routers from records are offline"

  const handleLogin = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);

      const response = await fetch("/vet-keyfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyfile: '',
          password: pw,
        }),
      });

      if (response.status > 399) {
        throw new Error("Incorrect password");
      }

      const result = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw,
        }),
      });

      if (result.status > 399) {
        throw new Error("Incorrect password");
      }

      const interval = setInterval(async () => {
        const res = await fetch("/");
        if (Number(res.headers.get('content-length')) !== appSizeOnLoad) {
          clearInterval(interval);
          window.location.replace("/");
        }
      }, 2000);
    } catch {
      setKeyErrs(["Incorrect password"])
      setLoading(false);
    }
  }, [pw, appSizeOnLoad]);

  return (
    <>
      <UqHeader msg="Login to Uqbar" openConnect={openConnect} closeConnect={closeConnect} hideConnect />
      {loading ? (
        <Loader msg={`Logging in to ${uqName}... `} />
      ) : (
        <form id="signup-form" className="col" onSubmit={handleLogin}>
          <div className="login-row col" style={{ marginLeft: '0.4em' }}> Login as {uqName} </div>

          <div className="login-row row" style={{ marginTop: '1em' }}> Enter Password </div>
          <input
            style={{ width: '100%' }}
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

          <div className="col" style={{ width: '100%' }}>
            {keyErrs.map((x, i) => (
              <span key={i} className="key-err">
                {x}
              </span>
            ))}
              <button type='submit'> Login </button>
              {/* <button onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigate('/?initial=false', { replace: true });
              }}>Main Menu</button> */}
          </div>
        </form>
      )}
    </>
  );
}

export default Login;
