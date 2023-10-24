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
import UqHeader from "./UqHeader"

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
  uqNft: UqNFT,
  openConnect: () => void,
}

function Login({ direct, pw, uqName, setDirect, setPw, setUqName, qns, openConnect }: LoginProps) {
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
      if (pw != "") {
        if (pw.length < 6)
          setPwErr("Password must be at least 6 characteers")
        else
          handlePassword()
      }
    }, 500)

  }, [pw])

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
    <UqHeader msg="Login to Uqbar" openConnect={openConnect}/>
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

      { pwErr ??  <div className="row"> <p style={{color:"red"}}> {pwErr} </p> </div> }
      { pwVet ??  <div className="row"> <p style={{color:"red"}}> {pwVet} </p> </div> }

      <div className="col">
        { keyErrs.map((x,i) => <span key={i} className="key-err">{x}</span>) }
        { keyErrs.length 
            ? <button onClick={()=>navigate('/reset')}> Reset Networking Information </button> 
            : <button onClick={handleLogin}> Login </button>
        }
      </div>
    </div></>
  )
}

export default Login;