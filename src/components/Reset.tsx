import React, { useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { QNS_REGISTRY_ADDRESSES, UQ_NFT_ADDRESSES } from "../constants/addresses";
import { QNSRegistry__factory, UqNFT__factory } from "../abis/types";
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

type ResetProps = {
  direct: boolean,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setConfirmedUqName: React.Dispatch<React.SetStateAction<string>>
}

function Reset({ direct, setDirect, setConfirmedUqName }: ResetProps) {
  const chainId = useChainId();
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [networkingKey, setNetworkingKey] = useState<string>('');
  const [ipAddr, setIpAddr] = useState<number>(0);
  const [port, setPort] = useState<number>(0);
  const [routers, setRouters] = useState<string[]>([]);

  const [name, setName] = useState<string>('');
  const [nameVets, setNameVets] = useState<string[]>([]);

  const [uploadKey, setUploadKey] = useState<boolean>(false)
  const [resetted, setResetted] = useState<boolean>(false);
  const [needKey, setNeedKey] = useState<boolean>(false);
  const [key, setKey] = useState<string>('');
  const [keyFileName, setKeyFileName] = useState<string>('');
  const [keyName, setKeyName] = useState<string>('');
  const [keyNetKey, setKeyNetKey] = useState<string>('');
  const [keyErrs, setKeyErrs] = useState<string[]>([]);

  const [aprioriDirect, setAprioriDirect] = useState<boolean>(false);

  const [pw, setPw] = useState<string>('');
  const [pw2, setPw2] = useState<string>('');
  const [pwErr, setPwErr] = useState<string>('');
  const [pwVet, setPwVet] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {

      let response = await fetch('/info', { method: 'GET' })
      let data = await response.json()
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
      setIpAddr(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])

      // await qns.setWsRecord(
      //   namehash("trebuchet.uq"),
      //   hexlify(randomBytes(32)),
      //   1,
      //   1,
      //   []
      // )

      response = await fetch('/has-keyfile', { method: 'GET'})
      data = await response.json()

      setUploadKey(data)
      setNeedKey(data)

    })()
  }, [])

  const nameDebouncer = useRef<NodeJS.Timeout | null>(null)

  const NAME_INVALID_PUNY = "Unsupported punycode character"
  const NAME_NOT_OWNER = "Name does not belong to this wallet"
  const NAME_NOT_REGISTERED = "Name is not registered"
  const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"

  useEffect(()=> {
    if (nameDebouncer.current) 
      clearTimeout(nameDebouncer.current);

    nameDebouncer.current = setTimeout(async () => {

        if (name == "") {
          setNameVets([])
          return;
        }

        let index: number
        let vets = [...nameVets]
        const kErrs = [...keyErrs]

        let normalized: string
        index = vets.indexOf(NAME_INVALID_PUNY)
        try {
          normalized = toAscii(name + ".uq")
          if (index != -1) vets.splice(index, 1)
        } catch (e) {
          if (index == -1) vets.push(NAME_INVALID_PUNY)
        }

        // only check if name is valid punycode
        if (normalized! !== undefined) {

          if (keyName != '') {
            index = kErrs.indexOf(KEY_DIFFERENT_USERNAME)
            if (keyName != normalized) {
              if (index == -1) kErrs.push(KEY_DIFFERENT_USERNAME)
            } else if (index != -1) kErrs.splice(index, 1)
          } 

          index = vets.indexOf(NAME_URL)
          if (name != "" && !isValidDomain(normalized)) {
            if (index == -1) vets.push(NAME_URL)
          } else if (index != -1) vets.splice(index, 1)

          try {

            const owner = await uqNft.ownerOf(hash(normalized))

            index = vets.indexOf(NAME_NOT_OWNER)
            if (owner == accounts![0] && index != -1) 
              vets.splice(index, 1);
            else if (index == -1 && owner != accounts![0])
              vets.push(NAME_NOT_OWNER);

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index != -1) vets.splice(index, 1)

            const wsRecords = await qns.ws(namehash(normalized))
            if (keyNetKey != '') {
              index = kErrs.indexOf(KEY_WRONG_NET_KEY)
              if (keyNetKey != wsRecords.publicKey) {
                if (index == -1) kErrs.push(KEY_WRONG_NET_KEY)
              } else if (index != -1) {
                kErrs.splice(index, 1)

                if (wsRecords.ip == 0) {
                  setAprioriDirect(false)
                  setDirect(false)
                } else {
                  setAprioriDirect(true)
                  setDirect(true)
                }

              }
            }

          } catch {

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index == -1) vets.push(NAME_NOT_REGISTERED)

          }
        }

        setNameVets(vets)
        setKeyErrs(kErrs)

    }, 500)

  }, [name])

  const pwDebouncer = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {

    if (pwDebouncer.current) 
      clearTimeout(pwDebouncer.current);

    pwDebouncer.current = setTimeout(async () => {

      if (pw2 != "" && pw != pw2)
        setPwErr("Passwords do not match")
      else {
        setPwErr("")
        if (6 <= pw.length) {
          handlePassword()
        }
      }

    }, 500)

  }, [pw, pw2])

  const KEY_DIFFERENT_USERNAME = "Keyfile does not match username"
  const KEY_WRONG_NET_KEY = "Keyfile does not match public key"

  const WS_WRONG_IP = "IP Address does not match records"
  const WS_BAD_ROUTERS = "Routers from records are offline"

  const handlePassword = async () => {
    try {
      const response = await fetch('/vet-keyfile', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyfile: key,
          password: pw
        })
      })

      setPwVet("")

      const data = await response.json()

      setKeyName(data.username)

      const errs = [...keyErrs]

      let index = errs.indexOf(KEY_DIFFERENT_USERNAME)
      if (data.username != `${name}.uq`) {
        if (index == -1) errs.push(KEY_DIFFERENT_USERNAME)
      } else if (index != -1) errs.splice(index, 1)

      const ws = await qns.ws(namehash(data.username))
      setKeyNetKey(`0x${data.networking_key}`)

      index = errs.indexOf(KEY_WRONG_NET_KEY)
      if (ws.publicKey != '0x' + data.networking_key) {
        if (index == -1) errs.push(KEY_WRONG_NET_KEY)
      } else if (index != -1) errs.splice(index, 1)

      index = errs.indexOf(WS_WRONG_IP)
      if (ws.ip != 0 && ws.ip != ipAddr) {
        if (index == -1) errs.push(WS_WRONG_IP)
      } else if (index != -1) errs.splice(index, 1)

      setKeyErrs(errs)

    } catch {
      setPwVet("Password is incorrect")
    }
  }

  const handleKeyfile = async (e: any) => {
    e.preventDefault()
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setKeyFileName(file.name)
      setKey(reader.result as string)
    }
    reader.readAsText(file)
  }

  const keyfileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyUploadClick = async (e: any) => {
    e.preventDefault()
    keyfileInputRef.current?.click()
  }

  const handleLogin = async () => {

    if (resetted || keyErrs.length == 0 || keyErrs.length == 0) {

    const response = await fetch('/boot', { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keyfile: resetted ? "" : key,
        reset: resetted,
        password: pw,
        username: `${name}.uq`,
        direct
      })
    })

    if (!needKey || resetted) {
      const base64Keyfile = await response.json()
      let blob = new Blob([base64Keyfile], {type: "text/plain;charset=utf-8"});
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.uq.keyfile`)
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

  const handleResetRecords = async (asDirect: boolean) => {

    const tx = await qns.setWsRecord(
      namehash(`${name}.uq`),
      `0x${networkingKey}`,
      asDirect ? ipAddr : 0,
      asDirect ? port : 0,
      asDirect ? [] : routers.map(x => namehash(x))
    )

    setLoading(true);

    await tx.wait();

    setResetted(true);
    setLoading(false);
    setDirect(asDirect);

  }

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>
  const uqNft = UqNFT__factory
    .connect(UQ_NFT_ADDRESSES[chainId], provider.getSigner());
  const qns = QNSRegistry__factory
    .connect(QNS_REGISTRY_ADDRESSES[chainId], provider.getSigner());

  const flipUploadKey = () => setUploadKey(needKey || !uploadKey)

  return (
    <div id="signup-form" className="col">
    { loading ? <Loader msg="Resetting Websocket Information"/> : <>
      <div className="row" style={{margin: "0 0 1em"}}>
        <div style={{fontSize: "0.75em"}}>Address:</div>
        {accounts && <div id="current-address">{accounts[0]}</div>}
      </div>

      <div className="login-row row">
        1. Enter .Uq Name
        <div className="tooltip-container">
          <div className="tooltip-button">&#8505;</div>
          <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
        </div>
      </div>

      <div className="col">
        <div style={{display:'flex', alignItems:'center'}}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            minLength={9}
            required
            name="uq-name"
            placeholder="e.g. myname"
          />
          .uq
        </div>
        { nameVets.map((x,i) => <span key={i} className="name-err">{x}</span>) }
      </div>

      <div className="login-row row">
        2. Choose Keyfile
        <br/>
      </div>

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
          { keyFileName ? "Change" : "Upload" } Keyfile
        </button>
        <p style={{opacity: !keyFileName ? .5 : 1 }}> { keyFileName ? keyFileName : ".keyfile"} </p>
        <input ref={keyfileInputRef} style={{display:"none"}} type="file" onChange={handleKeyfile} />
      </div>

      <div className="login-row row">
        3. Enter Password
        <br/>
      </div>

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

      { pwErr ??  <div className="row"> <p style={{color:"red"}}> {pwErr}</p> </div> }
      { pwVet ??  <div className="row"> <p style={{color:"red"}}> {pwVet}</p> </div> }

      <div className="login-row row">
        4. Overview
      </div>

      <div className="col">
        { keyErrs.map((x,i) => <span key={i} className="key-err">{x}</span>) }
        { (keyErrs.length > 1 || (keyErrs.length == 1 && keyErrs.indexOf(KEY_DIFFERENT_USERNAME) == -1)) ?
          <>
            <button onClick={()=>handleResetRecords(false)}> Reset </button>
            <input type="checkbox" checked={direct} onChange={()=>setDirect(!direct)} />  
            as direct node
          </> : ""
        }
      </div>

      <button onClick={handleLogin}> Submit </button>

      </>
    }
    </div>
  )
}

export default Reset;