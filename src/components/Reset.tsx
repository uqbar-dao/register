import React, { useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { QNS_REGISTRY_ADDRESSES, UQ_NFT_ADDRESSES } from "../constants/addresses";
import { QNSRegistry, UqNFT } from "../abis/types";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import { ipToNumber } from "../utils/ipToNumber";
import { toAscii } from 'idna-uts46-hx'
import { hash } from 'eth-ens-namehash'
import isValidDomain from 'is-valid-domain'
import Loader from "./Loader";
import UqHeader from "./UqHeader";

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
  setUqName: React.Dispatch<React.SetStateAction<string>>,
  qns: QNSRegistry,
  uqNft: UqNFT,
  openConnect: () => void
}

function Reset({ direct, setDirect, key, keyFileName, pw, setReset, uqName, setUqName, uqNft, qns, openConnect }: ResetProps) {
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

  const NAME_INVALID_PUNY = "Unsupported punycode character"
  const NAME_NOT_OWNER = "Name does not belong to this wallet"
  const NAME_NOT_REGISTERED = "Name is not registered"
  const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"

  const [ triggerNameCheck, setTriggerNameCheck ] = useState<boolean>(false)

  // so inputs will validate once wallet is connected
  useEffect(() => setTriggerNameCheck(!triggerNameCheck), [provider])

  const nameDebouncer = useRef<NodeJS.Timeout | null>(null)
  useEffect(()=> {

    if (nameDebouncer.current)
      clearTimeout(nameDebouncer.current);

    nameDebouncer.current = setTimeout(async () => {

        if (!provider) return

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

          } catch (e) {

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index == -1) vets.push(NAME_NOT_REGISTERED)

          }

          if (nameVets.length == 0)
            setUqName(normalized)

        }

        setNameVets(vets)

    }, 500)

  }, [name, triggerNameCheck])


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

    if (!provider)
      return openConnect()

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

  return ( <>
    <UqHeader msg="Reset Uqbar Node" openConnect={openConnect} />
    <div id="signup-form" className="col">
    { loading ? <Loader msg="Resetting Websocket Information"/> : <>
      <div className="login-row row">
        Enter .Uq Name
        <div className="tooltip-container">
          <div className="tooltip-button">&#8505;</div>
          <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
        </div>
      </div>

      <div className="col" style={{ width: '100%' }}>
        <div style={{display:'flex', alignItems:'center', width: '100%', marginBottom: '1em'}}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            minLength={9}
            required
            name="uq-name"
            placeholder="e.g. myname"
            style={{ width: '100%', marginRight: 8, }}
          />
          .uq
        </div>
        { nameVets.map((x,i) => <span key={i} className="name-err">{x}</span>) }
      </div>

      <div className="row">
        <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
        <label htmlFor="direct" className="direct-node-message">
          Reset as a direct node (only do this if you are hosting your node somewhere stable)
        </label>
      </div>

      <button onClick={()=>handleResetRecords(direct)}> Reset Networking Keys </button>

      </>
    }
    </div> </>
  )
}

export default Reset;