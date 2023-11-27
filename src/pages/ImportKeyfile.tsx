import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import UqHeader from "../components/UqHeader";
import { PageProps } from "../lib/types";
import Loader from "../components/Loader";

const KEY_WRONG_NET_KEY = "Keyfile does not match public key";
const KEY_WRONG_IP = "IP Address does not match records";

interface ImportKeyfileProps extends PageProps {

}

function ImportKeyfile({
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
}: ImportKeyfileProps) {
  const navigate = useNavigate();

  const [localKey, setLocalKey] = useState<string>("");
  const [localKeyFileName, setLocalKeyFileName] = useState<string>("");
  const [keyErrs, setKeyErrs] = useState<string[]>([]);

  const [pwErr, setPwErr] = useState<string>('');
  const [pwVet, setPwVet] = useState<boolean>(false);
  const [pwDebounced, setPwDebounced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // const handlePassword = useCallback(async () => {
  //   try {
  //     const response = await fetch("/vet-keyfile", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         keyfile: localKey,
  //         password: pw,
  //       }),
  //     });

  //     const data = await response.json();

  //     setUqName(data.username);

  //     setPwVet(true);

  //     const errs = [...keyErrs];

  //     const ws = await qns.ws(namehash(data.username));

  //     let index = errs.indexOf(KEY_WRONG_NET_KEY);
  //     if (ws.publicKey !== data.networking_key) {
  //       if (index === -1) errs.push(KEY_WRONG_NET_KEY);
  //     } else if (index !== -1) errs.splice(index, 1);

  //     index = errs.indexOf(KEY_WRONG_IP);
  //     if(ws.ip === 0)
  //       setDirect(false)
  //     else {
  //       setDirect(true)
  //       if (ws.ip !== ipAddress && index === -1)
  //         errs.push(KEY_WRONG_IP);
  //     }

  //     setKeyErrs(errs);
  //   } catch {
  //     setPwVet(false);
  //   }
  //   setPwDebounced(true);
  // }, [localKey, pw, keyErrs, ipAddress, qns, setUqName, setDirect]);

  // const pwDebouncer = useRef<NodeJS.Timeout | null>(null);
  // useEffect(() => {
  //   if (pwDebouncer.current) clearTimeout(pwDebouncer.current);

  //   pwDebouncer.current = setTimeout(async () => {
  //     if (pw !== "") {
  //       if (pw.length < 6)
  //         setPwErr("Password must be at least 6 characters")
  //       else {
  //         setPwErr("")
  //         handlePassword()
  //       }
  //     }
  //   }, 500)

  // }, [pw])


  // for if we check router validity in future
  // const KEY_BAD_ROUTERS = "Routers from records are offline"

  const handleKeyfile = useCallback((e: any) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalKey(reader.result as string);
      setLocalKeyFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  const keyfileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyUploadClick = async (e: any) => {
    e.preventDefault();
    keyfileInputRef.current?.click();
  };

  const handleImportKeyfile = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);

    try {
      if (keyErrs.length === 0 && localKey !== "") {
        const response = await fetch("/vet-keyfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyfile: localKey,
            password: pw,
          }),
        });

        if (response.status > 399) {
          throw new Error("Incorrect password");
        }

        const result = await fetch("/import-keyfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyfile: localKey,
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
      }
    } catch {
      window.alert('An error occurred, please try again.')
      setLoading(false);
    }
  }, [localKey, pw, keyErrs, direct, appSizeOnLoad]);

  return (
    <>
      <UqHeader msg="Import Keyfile" openConnect={openConnect} closeConnect={closeConnect} hideConnect />
      {loading ? (
        <Loader msg="Setting up node..." />
      ) : (
        <form id="signup-form" className="col" onSubmit={handleImportKeyfile}>
          <div className="login-row row"> 1. Upload Keyfile </div>

          <div
            style={{
              margin: ".5em 0",
              alignSelf: 'flex-start',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: '100%'
            }}
          >
            {Boolean(localKeyFileName) && <p style={{ textDecoration: 'underline' }}>
              {" "}
              {localKeyFileName ? localKeyFileName : ".keyfile"}{" "}
            </p>}
            <button onClick={handleKeyUploadClick}>{localKeyFileName ? "Change" : "Select"} Keyfile</button>
            <input
              ref={keyfileInputRef}
              style={{ display: "none" }}
              type="file"
              onChange={handleKeyfile}
            />
          </div>

          <div className="login-row row" style={{ marginTop: '1em' }}> 2. Enter Password </div>

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
            <button type="submit"> Import Keyfile </button>
          </div>
          <p style={{ lineHeight: '1.25em', fontFamily: 'Helvetica' }}>
            Please note: if the original node was booted as a direct node (static IP), then you must run this node from the same IP.
            If not, you will have networking issues. If you need to change the network options, please go back and select "Reset UqName".
          </p>
        </form>
      )}
    </>
  );
}

export default ImportKeyfile;
