import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT__factory, QNSRegistry__factory } from "../abis/types";
import { Link, useNavigate } from "react-router-dom";
import { toDNSWireFormat } from "../utils/dnsWire";
import { utils } from 'ethers';
import { ipToNumber } from "../utils/ipToNumber";
import { UQ_NFT_ADDRESSES, QNS_REGISTRY_ADDRESSES } from "../constants/addresses";
import EnterUqName from "./EnterUqName";
import Loader from "./Loader";

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type RegisterUqNameProps = {
  direct: boolean,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setConfirmedUqName: React.Dispatch<React.SetStateAction<string>>
}

function RegisterUqName({ direct, setDirect, setConfirmedUqName }: RegisterUqNameProps) {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();
  let navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('')
  const [nameValidities, setNameValidities] = useState<string[]>([])

  const [networkingKey, setNetworkingKey] = useState<string>('')
  const [ipAddress, setIpAddress] = useState<number>(0)
  const [port, setPort] = useState<number>(0)
  const [routers, setRouters] = useState<string[]>([])

  useEffect(() => {
    (async () => {
      const response = await fetch('/info', { method: 'GET'})
      const data = await response.json()
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
      setIpAddress(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])
    })()
  }, [])
  
  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>

  const uqNft = UqNFT__factory.connect(
    UQ_NFT_ADDRESSES[chainId], provider.getSigner());

  const qns = QNSRegistry__factory.connect(
    QNS_REGISTRY_ADDRESSES[chainId], provider.getSigner());


  const enterUqNameProps = { name, setName, nameValidities, setNameValidities }


  let handleRegister = async () => {

    const wsTx = await qns.populateTransaction.setWsRecord(
        utils.namehash(`${name}.uq`),
        '0x'+networkingKey,
        direct ? ipAddress : 0,
        direct ? port : 0,
        !direct ? routers.map(x => utils.namehash(x)) : []
    )

    const dnsFormat = toDNSWireFormat(`${name}.uq`);
    const tx = await uqNft.register(
      dnsFormat,
      accounts![0], 
      [wsTx.data!]
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
          <EnterUqName { ...enterUqNameProps } />
          <label htmlFor="direct">
            Register as a direct node (only do this if you are hosting your node somewhere stable)
          </label>
          <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
          <button disabled={nameValidities.length != 0} onClick={handleRegister}>
            Register Uqname
          </button>
          <Link to="/reset" style={{ color:"white" }}>already have an uq-name?</Link>
        </>
      }
    </div>
  )
}

export default RegisterUqName;
