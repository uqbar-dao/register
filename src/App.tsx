import { useState, useEffect } from "react";
import { Navigate, BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import { hooks } from "./connectors/metamask";
import {
  QNS_REGISTRY_ADDRESSES,
  UQ_NFT_ADDRESSES,
} from "./constants/addresses";
import { ChainId } from "./constants/chainId";
import { QNSRegistry, QNSRegistry__factory, UqNFT, UqNFT__factory } from "./abis/types";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import RegisterUqName from "./pages/RegisterUqName";
import ClaimUqInvite from "./pages/ClaimUqInvite";
import SetPassword from "./pages/SetPassword";
import Login from './pages/Login'
import Reset from './pages/ResetUqName'
import UqHome from "./pages/UqHome"
import ImportKeyfile from "./pages/ImportKeyfile";
import { UnencryptedIdentity } from "./lib/types";

const {
  useProvider,
} = hooks;

function App() {
  const provider = useProvider();
  const params = useParams()

  const [pw, setPw] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [keyFileName, setKeyFileName] = useState<string>('');
  const [reset, setReset] = useState<boolean>(false);
  const [direct, setDirect] = useState<boolean>(false);
  const [uqName, setUqName] = useState<string>('');
  const [appSizeOnLoad, setAppSizeOnLoad] = useState<number>(0);
  const [networkingKey, setNetworkingKey] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<number>(0);
  const [port, setPort] = useState<number>(0);
  const [routers, setRouters] = useState<string[]>([]);

  const [navigateToLogin, setNavigateToLogin] = useState<boolean>(false)
  const [initialVisit, setInitialVisit] = useState<boolean>(!params?.initial)

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

  useEffect(()=> setAppSizeOnLoad(
    (window.performance.getEntriesByType('navigation') as any)[0].transferSize
  ), []);

  useEffect(() => {
    (async () => {
      try {
        const infoResponse = await fetch('/info', {method: 'GET'})
        if (infoResponse.status > 399) {
          console.log('no info, unbooted')
          return
        }

        const info: UnencryptedIdentity = await infoResponse.json()

        if (initialVisit) {
          setUqName(info.name)
          setRouters(info.allowed_routers)
          setNavigateToLogin(true)
          setInitialVisit(false)
        }
      } catch {
        console.log('no info, unbooted')
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    provider, appSizeOnLoad,
    networkingKey, setNetworkingKey,
    ipAddress, setIpAddress,
    port, setPort,
    routers, setRouters,
  }

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
            <Route path="/claim-invite" element={<ClaimUqInvite {...props}/>} />
            <Route path="/register-name" element={<RegisterUqName  {...props}/>} />
            <Route path="/set-password" element={<SetPassword {...props}/>} />
            <Route path="/reset" element={<Reset {...props}/>} />
            <Route path="/import-keyfile" element={<ImportKeyfile {...props} />} />
            <Route path="/login" element={<Login {...props} />} />
          </Routes>
        </Router>
        </>
      }
    </>
  )
}

export default App;
