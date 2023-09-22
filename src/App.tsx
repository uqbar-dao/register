import React, { useState } from "react";
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  UQ_NFT_ADDRESSES,
} from "./constants/addresses";
import ConnectWallet from "./components/ConnectWallet";
import ClaimUqName from "./components/ClaimUqName";
import SetPassword from "./components/SetPassword";
import SetWs from "./components/SetWs";

export type Identity = {
  name: string,
  address: string,
  networking_key: string,
  ws_routing: any[], // (string, number)
  allowed_routers: string[]
}

const {
  useChainId,
  useProvider,
} = hooks;

function App() {
  let chainId = useChainId();
  let provider = useProvider();
  let [confirmedUqName, setConfirmedUqName] = useState('');
  let [our, setOur] = useState<Identity | null>(null);

  return (
    <>
      {
        !chainId?  <ConnectWallet /> :
        !provider? <ConnectWallet /> :
        !(chainId in QNS_REGISTRY_ADDRESSES)? <p>change networks</p> :
        !(chainId in UQ_NFT_ADDRESSES)?       <p>change networks</p> :
        !confirmedUqName? <ClaimUqName setConfirmedUqName={setConfirmedUqName}/> :
        !our?             <SetPassword confirmedUqName={confirmedUqName} setOur={setOur}/> :
        <SetWs our={our!} />
      }
    </>
  )
}

export default App;
