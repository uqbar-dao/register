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
}: LoginProps) {
  const navigate = useNavigate();

  const [keyErrs, setKeyErrs] = useState<string[]>([]);
  const [pwErr, setPwErr] = useState<string>('');
  const [pwVet, setPwVet] = useState<boolean>(false);
  const [pwDebounced, setPwDebounced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePassword = useCallback(async () => {
    return
    try {
      const response = await fetch("/vet-keyfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyfile: '',
          password: pw,
        }),
      });

      const data = await response.json();

      setUqName(data.username);

      setPwVet(true);

      const errs = [...keyErrs];

      const ws = await qns.ws(namehash(data.username));

      let index = errs.indexOf(KEY_WRONG_NET_KEY);
      if (ws.publicKey != data.networking_key) {
        if (index == -1) errs.push(KEY_WRONG_NET_KEY);
      } else if (index != -1) errs.splice(index, 1);

      index = errs.indexOf(KEY_WRONG_IP);
      if(ws.ip == 0)
        setDirect(false)
      else {
        setDirect(true)
        if (ws.ip != ipAddress && index == -1)
          errs.push(KEY_WRONG_IP);
      }

      setKeyErrs(errs);
    } catch {
      setPwVet(false);
    }
    setPwDebounced(true);
  }, [pw, keyErrs, ipAddress, qns, setUqName, setDirect]);

  const pwDebouncer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (pwDebouncer.current) clearTimeout(pwDebouncer.current);

    pwDebouncer.current = setTimeout(async () => {
      if (pw !== "") {
        if (pw.length < 6)
          setPwErr("Password must be at least 6 characters")
        else {
          setPwErr("")
          handlePassword()
        }
      }
    }, 500)

  }, [pw])

  const KEY_WRONG_NET_KEY = "Keyfile does not match public key";
  const KEY_WRONG_IP = "IP Address does not match records";

  // for if we check router validity in future
  // const KEY_BAD_ROUTERS = "Routers from records are offline"

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // if (keyErrs.length === 0 && pwVet) {
      try {
        setLoading(true);

        await fetch("/boot", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyfile: '',
            reset: false,
            password: pw,
            username: uqName,
            direct,
          }),
        });

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
    // }
  };

  return (
    <>
      <UqHeader msg="Login to Uqbar" openConnect={openConnect} hideConnect />
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
          />

          {pwErr && (
            <div className="row">
              {" "}
              <p style={{ color: "red" }}> {pwErr} </p>{" "}
            </div>
          )}
          {pwDebounced && !pwVet && 6 <= pw.length && (
            <div className="row">
              {" "}
              <p style={{ color: "red" }}> Password is incorrect </p>{" "}
            </div>
          )}

          <div className="col" style={{ width: '100%' }}>
            {keyErrs.map((x, i) => (
              <span key={i} className="key-err">
                {x}
              </span>
            ))}
            {keyErrs.length ? (
              <button onClick={() => navigate("/reset")}>
                {" "}
                Reset Networking Information{" "}
              </button>
            ) : (
              <>
                <button type='submit'> Login </button>
                <button onClick={(e) => {e.stopPropagation(); e.preventDefault(); navigate('/')}}>Main Menu</button>
              </>
            )}
          </div>
        </form>
      )}
    </>
  );
}

export default Login;
