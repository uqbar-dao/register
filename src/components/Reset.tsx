import React, { useState } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT__factory } from "../abis/types";
import {
  UQ_NFT_ADDRESSES,
} from "../constants/addresses";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";

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

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>
  let uqNftAddress = UQ_NFT_ADDRESSES[chainId];
  let uqNft = UqNFT__factory.connect(uqNftAddress, provider.getSigner());

  let checkUqName = async () => {
    if (!name) {
      window.alert('Please enter a name')
      return false
    }

    const nodeId = namehash((`${name}.uq`));

    try {
      let owner = await uqNft.ownerOf(nodeId)
      if (owner == accounts![0]) {
        setConfirmedUqName(`${name}.uq`);
        navigate("/set-password");
      } else {
        window.alert('You do not own this .uq name. Please try again.')
      }
    } catch {
      window.alert('This .uq name is not registered. Please try again.')
    }
  }

  return (
    <div id="signup-form" className="col">
      <div className="row">
        <h4>What is your .uq name?</h4>
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
        onClick={checkUqName}
      >Confirm Ownership of Uqname</button>
    </div>
  )
}

export default ClaimUqName;
