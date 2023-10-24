import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT } from "../abis/types";
import { UQ_NFT_ADDRESSES, } from "../constants/addresses";
import { Link, useNavigate } from "react-router-dom";
import { ipToNumber } from "../utils/ipToNumber"
import EnterUqName from "./EnterUqName";
import Loader from "./Loader";
import UqHeader from "./UqHeader"

global.Buffer = global.Buffer || require('buffer').Buffer;

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type ClaimUqNameProps = {
  direct: boolean,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setUqName: React.Dispatch<React.SetStateAction<string>>,
  uqNft: UqNFT,
  openConnect: () => void,
}

function ClaimUqInvite({ direct, setDirect, setUqName, uqNft, openConnect }: ClaimUqNameProps) {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();
  let navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(false);
  let [loaderMsg, setLoaderMsg] = useState('')

  const [triggerNameCheck, setTriggerNameCheck] = useState<boolean>(false)
  useEffect(()=> setTriggerNameCheck(!triggerNameCheck), [provider])

  let [invite, setInvite] = useState('');
  let [inviteValidity, setInviteValidity] = useState('');
  useEffect(() => {
    (async() => {

      if (invite != "") {

        const url = process.env.REACT_APP_INVITE_GET + invite

        const response = await fetch(url, { method: 'GET', })

        if (response!.status == 200) {
          setInviteValidity("")
        } else {
          setInviteValidity(await response.text())
        }
      }

    })()
  }, [invite])

  let [name, setName] = useState('');
  let [nameValidities, setNameValidities] = useState<string[]>([])

  const [ networkingKey, setNetworkingKey ] = useState<string>("")
  const [ routers, setRouters ] = useState<string[]>([])
  const [ ipAddress, setIpAddress ] = useState<number>(0)
  const [ port, setPort ] = useState<number>(0)

  useEffect(() => {
    (async () => {
      const response = await fetch('/info', { method: 'GET'})
      const data = await response.json()
      console.log("data", data)
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
      setIpAddress(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])
    })()
  }, []);

  let handleRegister = async () => {

    if (!provider)
      return openConnect()

    if (nameValidities.length != 0 || inviteValidity != '') return
    if (!name || !invite) {
      window.alert('Please enter a name and invite code')
      return false
    }

    let response

    setLoaderMsg('...Building EIP-4337 User Operation')
    setIsLoading(true);

    try {

      response = await fetch(
        process.env.REACT_APP_BUILD_USER_OP_POST!,
        { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name+".uq",
            address: accounts![0],
            networkingKey: networkingKey,
            wsIp: ipAddress,
            wsPort: port,
            routers: routers,
            direct: direct
          })
        }
      )

    } catch (e) {

      setLoaderMsg('')
      setIsLoading(false)

      alert(e)

      console.error("error from fetching userOp:", e);

      return;

    }

    setLoaderMsg('...Signing EIP-4337 User Operation')

    const data = await response.json()

    const uint8Array = new Uint8Array(Object.values(data.message))

    const signer = await provider?.getSigner()
    const signature = await signer?.signMessage(uint8Array)

    data.userOperation.signature = signature

    try {

      response = await fetch(
        process.env.REACT_APP_BROADCAST_USER_OP_POST!,
        { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userOp: data.userOperation,
            code: invite,
            name: name+".uq",
            eoa: accounts![0]
          })
        }
      )

    } catch (e) {

      setLoaderMsg('')
      setIsLoading(false);
      alert(e)
      console.error("error from broadcasting userOp:", e);
      return;

    }

    setLoaderMsg('')
    setIsLoading(false);

    setUqName(`${name}.uq`);

    navigate("/set-password");

  }

  const enterUqNameProps = { name, setName, nameValidities, setNameValidities, uqNft, triggerNameCheck }

  return (
    <>
    <UqHeader msg="Claim Uqbar Invite" openConnect={openConnect} />
    <div id="signup-form" className="col">
    {
        isLoading? <Loader msg={loaderMsg}/> :
        <>
          <div className="row">
            <h4>Set up your Uqbar node with a .uq name</h4>
            <div className="tooltip-container">
              <div className="tooltip-button">&#8505;</div>
              <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
            </div>
          </div>

          <div className="row" style={{ width: '100%' }}>
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              type="text"
              required
              name="uq-invite"
              placeholder="invite code"
            />
            { inviteValidity != "" && <div className="invite-validity">{inviteValidity}</div> }
          </div>

          <EnterUqName { ...enterUqNameProps } />

          <div className="row" style={{ marginTop: '1em' }}>
            <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
            <label htmlFor="direct" className="direct-node-message">
              Register as a direct node (only do this if you are hosting your node somewhere stable)
            </label>
          </div>

          <button disabled={nameValidities.length !== 0 || inviteValidity !== ''} onClick={handleRegister} >
              Register Uqname
          </button>

          <Link to="/reset" style={{ color:"white", marginTop: '1em' }}>already have an uq-name?</Link>
        </>
      }
    </div>
    </>
  )
}

export default ClaimUqInvite;
