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
  setUqName: React.Dispatch<React.SetStateAction<string>>
}

function RegisterUqName({ direct, setDirect, setUqName }: RegisterUqNameProps) {
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
    setUqName(`${name}.uq`);
    navigate("/set-password");

  }

  return (
    <>
    <div id="signup-form-header" className="row">
      <img alt="icon" style={{margin: "0 1em 0.2em 0"}} src="data:image/vnd.microsoft.icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP/x////AP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/4xwJ////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACmE/7MqhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+N4hJ////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AK4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/9twjHf///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//////8A////AP///wD///8A////ACqE//8qhP/D////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CCx////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP////8A////ACqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wAqhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwfyyqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP//Lob7wPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//////AP///wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE//8thvvL+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/KoT//yqE//////8A////ACqE//8rhf/M////ACqE//////8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//KoT////fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP8qhP//KoT//////wD///8AKoT//yuF/8z///8AKoT//////wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//yqE//8qhP///98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/yqE//8qhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8A////AP///wD///8A////AP///wD///8AKoT//yqE//8qhP//KoT//yqE////3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53B/7AKr/AyqE//////8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//yqE//8qhP//////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg/////wD///8AKoT//////wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//KoT//////wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wAqhP//////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT/kf///wD///8A////AP///wD///8AKoT//yqE//////8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/+dwg//ncIP7///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT/3SqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8AKoT//yuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP/53CD/+dwg//rcIL3///8A////AP///wD///8A////AP///wAqhP//K4X/zP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////ACqE//8rhf/M////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg//ncIP/53CD/+dwg/////wD///8A////AP///wD///8A////AP///wD///8A////ACuF/8z///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEPncIP/53CD/+dwg//ncIP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD/3yAQ+dwg//ncIP/53CD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8AKoT//yqE//////8A////AP///wD///8A////AP/fIBD53CD/+dwg9////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////ACqE//8qhP//////AP///wAqhP//KoT//////wD///8A////AP///wD///8A/98gEP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAKr/AyqE//////8A////ACqE//8qhP//////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//Z////mff/+Znx//mZ8P/pmfB/yZnwP8mZ8B/JmfAPyZnwDsm+cAbJ/jAGyf4QBMn+AADL/gAAy/4AAMv+AADL/gAAy/4AAMv+AADJ/gAAyf4QBsn+MAbJvnAHyZnwD8mZ8A/JmfAfyZnwP+mZ8H/5mfD/+Znx//+Z9///mf/8=" />
      <h1 style={{textAlign: "center"}}>Register Uqbar Node</h1>
    </div>
    <div id="signup-form" className="col">
    {
        isLoading ? <Loader msg="Registering QNS ID"/> :
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
    </>
  )
}

export default RegisterUqName;
