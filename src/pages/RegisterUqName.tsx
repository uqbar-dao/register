import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT, QNSRegistry } from "../abis/types";
import { Link, useNavigate } from "react-router-dom";
import { toDNSWireFormat } from "../utils/dnsWire";
import { utils } from 'ethers';
import { ipToNumber } from "../utils/ipToNumber";
import EnterUqName from "../components/EnterUqName";
import Loader from "../components/Loader";
import UqHeader from "../components/UqHeader";

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type RegisterUqNameProps = {
  direct: boolean,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setUqName: React.Dispatch<React.SetStateAction<string>>,
  uqNft: UqNFT,
  qns: QNSRegistry,
  openConnect: () => void,
}

function RegisterUqName({ direct, setDirect, setUqName, uqNft, qns, openConnect }: RegisterUqNameProps) {
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

  const [triggerNameCheck, setTriggerNameCheck] = useState<boolean>(false)

  useEffect(() => setTriggerNameCheck(!triggerNameCheck), [provider]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const enterUqNameProps = { name, setName, nameValidities, setNameValidities, uqNft, triggerNameCheck }

  let handleRegister = async () => {

    if (!provider)
      return openConnect()

    const wsTx = await qns.populateTransaction.setWsRecord(
        utils.namehash(`${name}.uq`),
        networkingKey,
        direct ? ipAddress : 0,
        direct ? port : 0,
        !direct ? routers.map(x => utils.namehash(x)) : []
    )

    const dnsFormat = toDNSWireFormat(`${name}.uq`);
    const tx = await uqNft.register(
      dnsFormat,
      accounts![0],
      [ wsTx.data! ]
    )

    setIsLoading(true);
    await tx.wait();
    setIsLoading(false);
    setUqName(`${name}.uq`);
    navigate("/set-password");
  }

  return (
    <>
      <UqHeader msg="Register Uqbar Node" openConnect={openConnect} />
      {Boolean(provider) && <div id="signup-form" className="col">
        {isLoading ? (
          <Loader msg="Registering QNS ID"/>
        ) : (
          <>
            <div className="row">
              <h4>Set up your Uqbar node with a .uq name</h4>
              <div className="tooltip-container">
                <div className="tooltip-button">&#8505;</div>
                <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
              </div>
            </div>
            <EnterUqName { ...enterUqNameProps } />
            <div className="row" style={{ marginTop: '1em' }}>
              <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
              <label htmlFor="direct" className="direct-node-message">
                Register as a direct node (only do this if you are hosting your node somewhere stable)
              </label>
            </div>
            <button disabled={nameValidities.length !== 0} onClick={handleRegister}>
              Register Uqname
            </button>
            <Link to="/reset" style={{ color:"white", marginTop: '1em' }}>already have an uq-name?</Link>
          </>
        )}
      </div>}
    </>
  )
}

export default RegisterUqName;
