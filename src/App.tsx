import React, { useState } from "react";
import { hooks, metaMask } from "./connectors/metamask";
import { FIFSRegistrar__factory } from "./abis/types";
import {
  QNS_REGISTRY_ADDRESSES,
  PUBLIC_RESOLVER_ADDRESSES,
  FIFS_REGISTRAR_ADDRESSES } from "./constants/addresses";
import { BigNumber } from "ethers";
import { toDNSWireFormat } from "./utils/dnsWire";
import ConnectWallet from "./components/ConnectWallet";

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;


function App() {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();
  let [name, setName] = useState('foo');

  if (!chainId) return <ConnectWallet />
  if (!provider) return <ConnectWallet />
  if (!(chainId in QNS_REGISTRY_ADDRESSES)) return <p>change networks</p>
  if (!(chainId in PUBLIC_RESOLVER_ADDRESSES)) return <p>change networks</p>
  if (!(chainId in FIFS_REGISTRAR_ADDRESSES)) return <p>change networks</p>
  let fifsRegistrarAddress = FIFS_REGISTRAR_ADDRESSES[chainId];
  let publicResolverAddress = PUBLIC_RESOLVER_ADDRESSES[chainId!];
  let fifsRegistrar = FIFSRegistrar__factory.connect(fifsRegistrarAddress, provider.getSigner());

  return (
    <div id="signup-form" className="col">
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          required
          name="uq-name"
          placeholder="e.g. myname"
        />
        <div className="uq">.uq</div>
      </div>
      <button
        onClick={
          async () => {
            const dnsFormat = toDNSWireFormat(`${name}.uq`);
            console.log('DNSWIRE', dnsFormat)
            const tx = await fifsRegistrar.register(
              dnsFormat,
              accounts![0],
              publicResolverAddress,
              BigNumber.from("1844674407709551615"), // TODO this will change
            )
            await tx.wait();
            console.log('adsf', tx)
          }
        }
      >Register Uqname</button>
    </div>
  )
}

export default App;
