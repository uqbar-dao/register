import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  UQ_NFT_ADDRESSES,
} from "./constants/addresses";
import ConnectWallet from "./components/ConnectWallet";
import ClaimUqName from "./components/ClaimUqName";
import ClaimUqInvite from "./components/ClaimUqInvite";
import SetPassword from "./components/SetPassword";
import SetWs from "./components/SetWs";
import Reset from './components/Reset'

export type Identity = {
  name: string,
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
        !(chainId in QNS_REGISTRY_ADDRESSES)? <p>change networks</p> : // TODO automatic prompt to switch to sepolia
        !(chainId in UQ_NFT_ADDRESSES)?       <p>change networks</p> :
        <Router>
          <Routes>
            <Route path="/claim-invite" element={<ClaimUqInvite setConfirmedUqName={setConfirmedUqName}/>} />
            <Route path="/" element={<ClaimUqName setConfirmedUqName={setConfirmedUqName}/>} />
            <Route path="/reset" element={<Reset setConfirmedUqName={setConfirmedUqName}/>} />
            <Route path="/set-password" element={<SetPassword confirmedUqName={confirmedUqName} setOur={setOur}/>} />
            <Route path="/set-ws" element={<SetWs our={our!} />} />
          </Routes>
        </Router>
      }
    </>
  )
}

export default App;
