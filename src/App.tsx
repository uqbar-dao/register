import React, { useState } from "react";
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  PUBLIC_RESOLVER_ADDRESSES,
  FIFS_REGISTRAR_ADDRESSES
} from "./constants/addresses";
import ConnectWallet from "./components/ConnectWallet";
import ClaimUqName from "./components/ClaimUqName";
import SetPassword from "./components/SetPassword";

export type WsRouting = {
  ip: string,
  port: number
}

export type Identity = {
  name: string,
  address: string,
  networking_key: string,
  ws_routing: WsRouting,
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

  if (!chainId) return <ConnectWallet />
  if (!provider) return <ConnectWallet />
  if (!(chainId in QNS_REGISTRY_ADDRESSES)) return <p>change networks</p>
  if (!(chainId in PUBLIC_RESOLVER_ADDRESSES)) return <p>change networks</p>
  if (!(chainId in FIFS_REGISTRAR_ADDRESSES)) return <p>change networks</p>

  return (
    <>
      {
        !confirmedUqName? <ClaimUqName setConfirmedUqName={setConfirmedUqName}/> :
        !our?             <SetPassword confirmedUqName={confirmedUqName} setOur={setOur}/> :
        <>TODO post to chain using setWs</>
      }
    </>
  )
}

export default App;
