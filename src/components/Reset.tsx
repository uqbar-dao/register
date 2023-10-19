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
  key: string,
  keyFileName: string,
  pw: string,
  reset: boolean,
  uqName: string,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setReset: React.Dispatch<React.SetStateAction<boolean>>,
  setPw: React.Dispatch<React.SetStateAction<string>>,
  setUqName: React.Dispatch<React.SetStateAction<string>>
}

function Reset({ direct, setDirect, key, keyFileName, pw, setReset, uqName, setUqName }: ResetProps) {
  const chainId = useChainId();
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [networkingKey, setNetworkingKey] = useState<string>('');
  const [ipAddr, setIpAddr] = useState<number>(0);
  const [port, setPort] = useState<number>(0);
  const [routers, setRouters] = useState<string[]>([]);

  const [name, setName] = useState<string>(uqName.slice(0,-3));
  const [nameVets, setNameVets] = useState<string[]>([]);

  const [uploadKey, setUploadKey] = useState<boolean>(false)
  const [needKey, setNeedKey] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {

      let response = await fetch('/info', { method: 'GET' })
      let data = await response.json()
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
      setIpAddr(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])

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


        if (name == "") { setNameVets([]); return; }

        let index: number
        let vets = [...nameVets]

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

          } catch {

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index == -1) vets.push(NAME_NOT_REGISTERED)

          }

          if (nameVets.length == 0) 
            setUqName(normalized)

        }

        setNameVets(vets)

    }, 500)

  }, [name])

  const handleLogin = async () => {

    const response = await fetch('/boot', { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keyfile: "",
        reset: true,
        password: pw,
        username: `${name}.uq`,
        direct
      })
    })
    
    const base64Keyfile = await response.json()
    let blob = new Blob([base64Keyfile], {type: "text/plain;charset=utf-8"});
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name}.uq.keyfile`)
    document.body.appendChild(link);
    link.click();

    const interval = setInterval(async () => {
      const homepageResult = await fetch('/') 
      if (homepageResult.status < 400) {
        clearInterval(interval)
        window.location.replace('/')
      }
    }, 2000);

  };

  const handleResetRecords = async (asDirect: boolean) => {

    const tx = await qns.setWsRecord(
      namehash(uqName),
      `0x${networkingKey}`,
      asDirect ? ipAddr : 0,
      asDirect ? port : 0,
      asDirect ? [] : routers.map(x => namehash(x))
    )

    setLoading(true);

    await tx.wait();

    if (pw) handleLogin();
    else {
      setReset(true);
      setLoading(false);
      setDirect(asDirect);
      navigate('/set-password');
    }

  }

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>
  const uqNft = UqNFT__factory
    .connect(UQ_NFT_ADDRESSES[chainId], provider.getSigner());
  const qns = QNSRegistry__factory
    .connect(QNS_REGISTRY_ADDRESSES[chainId], provider.getSigner());

  const flipUploadKey = () => setUploadKey(needKey || !uploadKey)

  return ( <>
    <div id="signup-form-header" className="row">
      <img alt="icon" style={{margin: "0 1em 0.2em 0"}} src="data:image/vnd.microsoft.icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP/x////AP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/4xwJ////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACmE/7MqhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+N4hJ////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AK4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/9twjHf///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//////8A////AP///wD///8A////ACqE//8qhP/D////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CCx////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP////8A////ACqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wAqhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwfyyqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP//Lob7wPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE//8thvvL+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53B/7AKr/AyqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//////wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT/kf///wD///8A////AP///wD///8AKoT//yqE//////8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP7///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT/3SqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//rcIL3///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg9////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAKr/AyqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//Z////mff/+Znx//mZ8P/pmfB/yZnwP8mZ8B/JmfAPyZnwDsm+cAbJ/jAGyf4QBMn+AADL/gAAy/4AAMv+AADL/gAAy/4AAMv+AADJ/gAAyf4QBsn+MAbJvnAHyZnwD8mZ8A/JmfAfyZnwP+mZ8H/5mfD/+Znx//+Z9///mf/8=" />
      <h1 style={{textAlign: "center"}}>Reset Uqbar Node</h1>
    </div>
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

      <label htmlFor="direct">
        Reset info as a direct node (only do this if you are hosting your node somewhere stable)
      </label>
      <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>

      <button onClick={()=>handleResetRecords(direct)}> Reset Networking Keys </button>

      </>
    }
    </div> </>
  )
}

export default Reset;