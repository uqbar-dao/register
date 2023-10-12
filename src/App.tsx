import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  UQ_NFT_ADDRESSES,
} from "./constants/addresses";
import ConnectWallet from "./components/ConnectWallet";
import RegisterUqName from "./components/RegisterUqName";
import ClaimUqInvite from "./components/ClaimUqInvite";
import SetPassword from "./components/SetPassword";
import Reset from './components/Reset'
import UqHome from "./components/UqHome"

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
  let [direct, setDirect] = useState<boolean>(false)

  const props = { direct, setDirect, setConfirmedUqName }
  const registerUqElement = <RegisterUqName direct={direct} setDirect={setDirect} setConfirmedUqName={setConfirmedUqName} />

  return (
    <>
      {
        !chainId?  <ConnectWallet /> :
        !provider? <ConnectWallet /> :
        !(chainId in QNS_REGISTRY_ADDRESSES)? <p>change networks</p> : // TODO automatic prompt to switch to sepolia
        !(chainId in UQ_NFT_ADDRESSES)?       <p>change networks</p> :
        <Router>
          <Routes>
            <Route path="/" element={<UqHome/>} />
            <Route path="/register-name" element={<RegisterUqName  {...props}/>} />
            <Route path="/claim-invite" element={<ClaimUqInvite {...props}/>} />
            <Route path="/set-password" element={<SetPassword direct={direct} confirmedUqName={confirmedUqName}/>} />
            <Route path="/reset" element={<Reset setConfirmedUqName={setConfirmedUqName}/>} />
          </Routes>
        </Router>
      }
    </>
  )
}

export default App;
