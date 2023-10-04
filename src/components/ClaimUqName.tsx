import React, { useState } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT__factory } from "../abis/types";
import {
  UQ_NFT_ADDRESSES,
} from "../constants/addresses";
import { toDNSWireFormat } from "../utils/dnsWire";
import Loader from "./Loader";
import { Link, useNavigate } from "react-router-dom";
import * as punycode from 'punycode/';
import ucs2 from 'punycode/';

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type ClaimUqNameProps = {
  setConfirmedUqName: React.Dispatch<React.SetStateAction<string>>
}

function ClaimUqName({ setConfirmedUqName }: ClaimUqNameProps) {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();
  let navigate = useNavigate();
  let [name, setName] = useState('');
  let [invite, setInvite] = useState('');
  let [isLoading, setIsLoading] = useState(false);

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>
  let uqNftAddress = UQ_NFT_ADDRESSES[chainId];
  let uqNft = UqNFT__factory.connect(uqNftAddress, provider.getSigner());

  async function clickme () {

    const str = '😆😆😆😆😆'
    const len = [...str].length

    const address = accounts![0]

    const response = await fetch('http://127.0.0.1:3000/api', {
      method: 'POST',
      body: JSON.stringify({ name: name+".uq", address })
    })

    const data = await response.json()
    const uint8Array = new Uint8Array(data.message.match(/.{1,2}/g).map((x: any) => parseInt(x, 16)));

    const signer = await provider?.getSigner()

    const signature = await signer?.signMessage(uint8Array)

    data.userOperation.signature = signature

    console.log("broadcasting...")

    const broadcast = await fetch('http://127.0.0.1:3000/api/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        userOp: data.userOperation,
        code: invite,
        name: name+".uq",
        eoa: accounts![0]
      })
    })

  }

  let handleRegister = async () => {
    if (!name) {
      window.alert('Please enter a name')
      return false
    }

    const dnsFormat = toDNSWireFormat(`${name}.uq`);

    // TODO handle transaction rejected in wallet

    const tx = await uqNft.register(
      dnsFormat,
      accounts![0], // TODO let the user know that this address will be the owner
    )
    setIsLoading(true);
    await tx.wait();
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
            <h4>Set up your Uqbar node with a .uq name</h4>
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
          </div>
          <div className="row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              minLength={9}
              required
              name="uq-name"
              placeholder="e.g. myname"
            />
            <div className="uq">.uq</div>
          </div>
          <button
            onClick={handleRegister}
          >Register Uqname</button>
          <Link to="/reset" style={{ color:"white" }}>already have an uq-name?</Link>
        </>
      }

        <button onClick={() => clickme()}> click! </button>

    </div>
  )
}

export default ClaimUqName;
