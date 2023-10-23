import { useState, useEffect } from "react";
import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  UQ_NFT_ADDRESSES,
} from "./constants/addresses";
import { ChainId } from "./constants/chainId";
import { QNSRegistry, QNSRegistry__factory, UqNFT, UqNFT__factory } from "./abis/types";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import RegisterUqName from "./components/RegisterUqName";
import ClaimUqInvite from "./components/ClaimUqInvite";
import SetPassword from "./components/SetPassword";
import Login from './components/Login'
import Reset from './components/Reset'
import UqHome from "./components/UqHome"
import { useWeb3React } from "@web3-react/core";

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

  const [pw, setPw] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [keyFileName, setKeyFileName] = useState<string>('');
  const [reset, setReset] = useState<boolean>(false);
  const [direct, setDirect] = useState<boolean>(false);
  const [uqName, setUqName] = useState<string>('');

  const [navigateToLogin, setNavigateToLogin] = useState<boolean>(false)
  const [initialVisit, setInitialVisit] = useState<boolean>(true)

  const [ connectOpen, setConnectOpen ] = useState<boolean>(false);
  const openConnect = () => setConnectOpen(true)
  const closeConnect = () => setConnectOpen(false)

  const [ uqNft, setUqNft ] = useState<UqNFT>(
    UqNFT__factory.connect(
      UQ_NFT_ADDRESSES[ChainId.SEPOLIA], 
      new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL))
  );

  const [ qns, setQns ] = useState<QNSRegistry>(
    QNSRegistry__factory.connect(
      QNS_REGISTRY_ADDRESSES[ChainId.SEPOLIA],
      new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL))
  );

  useEffect(() => {
    (async () => {
      const response = await fetch('/has-keyfile', {method: 'GET'})
      const data = await response.json()

      if (!!data && initialVisit) {
        setNavigateToLogin(true)
        setInitialVisit(false)
      }

    })()
  }, [])

  useEffect(() => setNavigateToLogin(false), [initialVisit])

  useEffect(() => {
    if (provider) {
      setUqNft(UqNFT__factory.connect(
        UQ_NFT_ADDRESSES[ChainId.SEPOLIA], 
        provider!.getSigner())
      )
      setQns(QNSRegistry__factory.connect(
        QNS_REGISTRY_ADDRESSES[ChainId.SEPOLIA],
        provider!.getSigner())
      )
    }
  }, [provider])

  // just pass all the props each time since components won't mind extras
  const props = { 
    direct, setDirect, 
    key, 
    keyFileName, setKeyFileName, 
    reset, setReset,
    pw, setPw, 
    uqName, setUqName,
    uqNft, qns,
    connectOpen, openConnect, closeConnect, 
  }

  console.log("navigate to login", navigateToLogin)

  return (
    <>
      {
        <>
        <ConnectWallet {...props}/> 
        <Router>
          <Routes>
            <Route path="/" element={navigateToLogin 
              ? <Navigate to="/login" replace />
              : <UqHome {...props} />
            } />
            <Route path="/login" element={<Login {...props} />} />
            <Route path="/reset" element={<Reset {...props}/>} />
            <Route path="/claim-invite" element={<ClaimUqInvite {...props}/>} />
            <Route path="/register-name" element={<RegisterUqName  {...props}/>} />
            <Route path="/set-password" element={<SetPassword {...props}/>} />
          </Routes>
        </Router>
        </>
      }
    </>
  )
}

export default App;
