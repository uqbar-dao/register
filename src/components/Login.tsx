import React, { useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { QNSRegistry, UqNFT } from "../abis/types";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import { ipToNumber } from "../utils/ipToNumber";
import { toAscii } from 'idna-uts46-hx'
import { hash } from 'eth-ens-namehash'
import isValidDomain from 'is-valid-domain'
import Loader from "./Loader";

import { hexlify, randomBytes } from "ethers/lib/utils";

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type LoginProps = {
  direct: boolean,
  pw: string,
  uqName: string,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>, 
  setPw: React.Dispatch<React.SetStateAction<string>>,
  setUqName: React.Dispatch<React.SetStateAction<string>>,
  qns: QNSRegistry,
  uqNft: UqNFT
}

function Login({ direct, pw, uqName, setDirect, setPw, setUqName, qns }: LoginProps) {
  const chainId = useChainId();
  const provider = useProvider();
  const navigate = useNavigate();

  const [ipAddr, setIpAddr] = useState<number>(0);
  const [port, setPort] = useState<number>(0);
  const [routers, setRouters] = useState<string[]>([]);

  const [uploadKey, setUploadKey] = useState<boolean>(false)
  const [needKey, setNeedKey] = useState<boolean>(false);
  const [localKey, setLocalKey] = useState<string>('');
  const [localKeyFileName, setLocalKeyFileName] = useState<string>('');
  const [keyErrs, setKeyErrs] = useState<string[]>([]);

  const [pw2, setPw2] = useState<string>('');
  const [pwErr, setPwErr] = useState<string>('');
  const [pwVet, setPwVet] = useState<string>('');

  useEffect(() => {
    (async () => {

      let response = await fetch('/info', { method: 'GET' })
      let data = await response.json()
      setRouters(data.allowed_routers)
      setIpAddr(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])

      response = await fetch('/has-keyfile', { method: 'GET'})
      data = await response.json()

      console.log("DATA~~", data)

      setUploadKey(!data)
      setNeedKey(!data)

    })()
  }, [])

  const pwDebouncer = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {

    if (pwDebouncer.current) 
      clearTimeout(pwDebouncer.current);

    pwDebouncer.current = setTimeout(async () => {
      if (pw != "" && pw2 != "") {
        if (pw.length < 6)
          setPwErr("Password must be at least 6 characteers")
        else if (pw == pw2) {
          setPwErr("")
          handlePassword()
        } else 
          setPwErr("Passwords must match")
      } 
    }, 500)

  }, [pw, pw2])

  const KEY_WRONG_NET_KEY = "Keyfile does not match public key"
  const KEY_WRONG_IP = "IP Address does not match records"

  // for if we check router validity in future
  // const KEY_BAD_ROUTERS = "Routers from records are offline"

  const handlePassword = async () => {
    try {

      const response = await fetch('/vet-keyfile', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyfile: localKey,
          password: pw
        })
      })

      setPwVet("")

      const data = await response.json()

      setUqName(data.username)

      const errs = [...keyErrs]

      const ws = await qns.ws(namehash(data.username))

      let index = errs.indexOf(KEY_WRONG_NET_KEY)
      if (ws.publicKey != '0x' + data.networking_key) {
        if (index == -1) errs.push(KEY_WRONG_NET_KEY)
      } else if (index != -1) errs.splice(index, 1)

      index = errs.indexOf(KEY_WRONG_IP)
      if (ws.ip != 0 && ws.ip != ipAddr) {
        if (index == -1) errs.push(KEY_WRONG_IP)
      } else if (index != -1) {
        errs.splice(index, 1)
        setDirect(true)
      }

      setKeyErrs(errs)

    } catch {

      setPwVet("Password is incorrect")

    }
  }

  const handleKeyfile = (e: any) => {
    e.preventDefault()
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLocalKey(reader.result as string)
      setLocalKeyFileName(file.name)
    }
    reader.readAsText(file)
  }

  const keyfileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyUploadClick = async (e: any) => {
    e.preventDefault()
    keyfileInputRef.current?.click()
  }

  const handleLogin = async () => {

    if (keyErrs.length == 0) {

      const response = await fetch('/boot', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyfile: localKey,
          reset: false,
          password: pw,
          username: uqName,
          direct
        })
      })

      if (!needKey) {
        const base64Keyfile = await response.json()
        let blob = new Blob([base64Keyfile], {type: "text/plain;charset=utf-8"});
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${uqName}.keyfile`)
        document.body.appendChild(link);
        link.click();
      }

      const interval = setInterval(async () => {
        const homepageResult = await fetch('/') 
        if (homepageResult.status < 400) {
          clearInterval(interval)
          window.location.replace('/')
        }
      }, 2000);

    }

  };


  const flipUploadKey = () => setUploadKey(needKey || !uploadKey)

  return (
    <>
    <div id="signup-form-header" className="row">
      <img alt="icon" style={{margin: "0 1em 0.2em 0"}} src="data:image/vnd.microsoft.icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP/x////AP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/4xwJ////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACmE/7MqhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+N4hJ////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AK4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/9twjHf///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//////8A////AP///wD///8A////ACqE//8qhP/D////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CCx////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP////8A////ACqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wAqhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwfyyqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP//Lob7wPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE//8thvvL+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53B/7AKr/AyqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//////wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT/kf///wD///8A////AP///wD///8AKoT//yqE//////8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP7///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT/3SqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//rcIL3///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg9////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAKr/AyqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//Z////mff/+Znx//mZ8P/pmfB/yZnwP8mZ8B/JmfAPyZnwDsm+cAbJ/jAGyf4QBMn+AADL/gAAy/4AAMv+AADL/gAAy/4AAMv+AADJ/gAAyf4QBsn+MAbJvnAHyZnwD8mZ8A/JmfAfyZnwP+mZ8H/5mfD/+Znx//+Z9///mf/8=" />
      <h1 style={{textAlign: "center"}}>Login to Uqbar</h1>
    </div>
    <div id="signup-form" className="col">

      <div className="login-row col"> Login as... { uqName } </div>

      <div className="login-row row"> 1. Select Keyfile </div>

      <div className="row" style={{margin: ".5em", opacity: needKey ? .5 : 1}}> 
        <label> 
          <input disabled={needKey} type="checkbox" checked={!uploadKey} onChange={flipUploadKey} />
          { needKey ? "No" : "Use" } Existing Keyfile 
        </label>
      </div>

      <div style={{margin: ".5em", display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: uploadKey ?  1 : .5}}>
        <div className="row"> 
          <label>
            <input type="checkbox" checked={uploadKey} onChange={flipUploadKey} />
            Upload Keyfile
          </label>
        </div>
        <button style={{width: "50%", fontSize: "65%" }} onClick={handleKeyUploadClick}> 
          { localKeyFileName ? "Change" : "Upload" } Keyfile
        </button>
        <p style={{opacity: !localKeyFileName ? .5 : 1 }}> { localKeyFileName ? localKeyFileName : ".keyfile"} </p>
        <input ref={keyfileInputRef} style={{display:"none"}} type="file" onChange={handleKeyfile} />
      </div>

      <div className="login-row row"> 2. Enter Password </div>

      <div className="row">
        <div className="row label-row">
          <label htmlFor="password">Enter Password</label>
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
      </div>

      <div className="row">
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
      </div>

      { pwErr ??  <div className="row"> <p style={{color:"red"}}> {pwErr} </p> </div> }
      { pwVet ??  <div className="row"> <p style={{color:"red"}}> {pwVet} </p> </div> }

      <div className="col">
        { keyErrs.map((x,i) => <span key={i} className="key-err">{x}</span>) }
        { keyErrs.length 
            ? <button onClick={()=>navigate('/reset')}> Reset Networking Information </button> 
            : <button onClick={handleLogin}> Login </button>
        }
      </div>
            <button onClick={()=>navigate('/')}> home Information </button> 


    </div></>
  )
}

export default Login;