import { useState, useEffect } from "react";
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
import Login from './components/Login'
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
  const chainId = useChainId();
  const provider = useProvider();
  
  const [direct, setDirect] = useState<boolean>(false);
  const [confirmedUqName, setConfirmedUqName] = useState<string>('');

  const props = { direct, setDirect, setConfirmedUqName }

  return (
    <>
      {
        !chainId || !provider ?  <ConnectWallet /> :
        !(chainId in QNS_REGISTRY_ADDRESSES) || !(chainId in UQ_NFT_ADDRESSES) 
          ? <p>change networks</p> : // TODO automatic prompt to switch to sepolia
        <Router>
          <Routes>
            <Route path="/" element={<UqHome/>} />
            <Route path="/login" element={<Login {...props}/>} />
            <Route path="/reset" element={<Reset {...props}/>} />
            <Route path="/claim-invite" element={<ClaimUqInvite {...props}/>} />
            <Route path="/register-name" element={<RegisterUqName  {...props}/>} />
            <Route path="/set-password" element={<SetPassword {...{direct, confirmedUqName}}/>} />
          </Routes>
        </Router>
      }
    </>
  )
}

export default App;
