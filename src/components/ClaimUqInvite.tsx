import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT__factory } from "../abis/types";
import {
  UQ_NFT_ADDRESSES,
} from "../constants/addresses";
import Loader from "./Loader";
import { Link, useNavigate } from "react-router-dom";
import * as punycode from 'punycode/';
import isValidDomain from 'is-valid-domain'
import { hash, normalize } from 'eth-ens-namehash'
import { Identity } from "../App";

global.Buffer = global.Buffer || require('buffer').Buffer;

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type ClaimUqNameProps = {
  setConfirmedUqName: React.Dispatch<React.SetStateAction<string>>
}

function ClaimUqInvite({ setConfirmedUqName }: ClaimUqNameProps) {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();
  let navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(false);

  let uqNftAddress = UQ_NFT_ADDRESSES[chainId!];
  let uqNft = UqNFT__factory.connect(uqNftAddress, provider!.getSigner());

  let [invite, setInvite] = useState('');
  let [inviteValidity, setInviteValidity] = useState('');
  useEffect(() => {
    (async() => {

      if (invite != "") {

        const url = process.env.REACT_APP_INVITE_GET + invite

        const response = await fetch(url, { method: 'GET', })

        if (response!.status == 200) {
          setInviteValidity("")
        } else {
          setInviteValidity(await response.text())
        }
      }

    })()
  }, [invite])

  const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"
  const NAME_LENGTH = "Name must be 9 characters or more"
  const NAME_CLAIMED = "Name is already claimed"
  const NAME_INVALID_PUNY = "Unsupported punycode character"

  let [name, setName] = useState('');
  let [nameValidity, setNameValidity] = useState<string[]>([])
  useEffect( () => {
    (async() => {

      let index
      let validities = [...nameValidity]

      const len = [...name].length

      let normalized: string
      index = validities.indexOf(NAME_INVALID_PUNY)
      try {
        normalized = normalize(punycode.toASCII(name + ".uq"))
        if (index != -1) validities.splice(index, 1)
      } catch (e) {
        if (index == -1) validities.push(NAME_INVALID_PUNY)
      }

      index = validities.indexOf(NAME_LENGTH)
      if (len < 9)  {
        if (index == -1) validities.push(NAME_LENGTH)
      } else if (index != -1) validities.splice(index, 1)

      index = validities.indexOf(NAME_URL)
      if (name != "" && !isValidDomain(punycode.toASCII(normalized!))) {
        if (index == -1) validities.push(NAME_URL)
      } else if (index != -1) validities.splice(index, 1)

      index = validities.indexOf(NAME_CLAIMED)
      if (validities.length == 0 || index != -1) {
        try {
          await uqNft.ownerOf(hash(punycode.toASCII(normalized!)))
          if (index == -1) validities.push(NAME_CLAIMED)
        } catch (e) {
          if (index != -1) validities.splice(index, 1)
        }
      }

      setNameValidity(validities)

    })()
  }, [name])

  const [ networkingKey, setNetworkingKey ] = useState<string>("")
  const [ routers, setRouters ] = useState<string[]>([])
  const [ ipAddress, setIpAddress ] = useState<string>("")
  const [ port, setPort ] = useState<number>(0)

  useEffect(() => {
    (async () => {
      const response = await fetch('/get-ws-info', { method: 'GET'})
      const data = await response.json()
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
    })()
  }, []);

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>

  let handleRegister = async () => {

    if (nameValidity.length != 0 || inviteValidity != '') return
    if (!name || !invite) {
      window.alert('Please enter a name and invite code')
      return false
    }

    let response

    setIsLoading(true);
    
    try {

      response = await fetch(
        process.env.REACT_APP_BUILD_USER_OP_POST!,
        { method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: name+".uq", 
            address: accounts![0],
            networkingKey: networkingKey,
            wsIp: ipAddress,
            wsPort: port,
            routers: routers
          }) 
        }
      )

    } catch (e) {

      setIsLoading(false)

      alert(e)

      console.error("error from fetching userOp:", e);
      return;

    }

    setIsLoading(false);

    const data = await response.json()

    console.log("RESPONSE", response)
    console.log("DATA", data)

    const uint8Array = new Uint8Array(Object.values(data.message))
    // const uint8Array = new Uint8Array(data.message.match(/.{1,2}/g).map((x: any) => parseInt(x, 16)));

    const signer = await provider?.getSigner()
    const signature = await signer?.signMessage(uint8Array)

    data.userOperation.signature = signature

    setIsLoading(true);

    try {

      response = await fetch(
        process.env.REACT_APP_BROADCAST_USER_OP_POST!,
        { method: 'POST',
          // headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userOp: data.userOperation,
            code: invite,
            name: name+".uq",
            eoa: accounts![0]
          })
        }
      )

    } catch (e) {

      setIsLoading(false);
      alert(e)
      console.error("error from broadcasting userOp:", e);
      return;

    }

    setIsLoading(false);

    setConfirmedUqName(`${name}.uq`);

    navigate("/set-password");

  }

  return (
    <div id="signup-form" className="col">
    {
        isLoading? <Loader msg="Registering QNS ID"/> :
        <>
          <div className="row">
            <h4>Set up your Uqbar node with a .uq name.</h4>
            <div className="tooltip-container">
              <div className="tooltip-button">&#8505;</div>
              <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
            </div>
          </div>
          <div className="row" style={{margin: "0 0 1em"}}>
              <div style={{fontSize: "0.75em"}}>Address:</div>
              {accounts && <div id="current-address">{accounts[0]}</div>}
            </div>
          <div className="row">
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              type="text"
              required
              name="uq-invite"
              placeholder="invite code"
            />
            { inviteValidity != "" && <div className="invite-validity">{inviteValidity}</div> }
          </div>
          <div className="row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              name="uq-name"
              placeholder="e.g. myname"
            />
            <div className="uq">.uq</div>
            { nameValidity.map((x,i) => <div><br/><span key={i} className="name-validity">{x}</span></div>) }
          </div>
          <button onClick={handleRegister} >Register Uqname</button>
          <Link to="/reset" style={{ color:"white" }}>already have an uq-name?</Link>
        </>
      }
    </div>
  )
}

export default ClaimUqInvite;
