import React, { useState, useEffect, FormEvent } from "react";
import { hooks } from "../connectors/metamask";
import { Link, useNavigate } from "react-router-dom";
import EnterUqName from "../components/EnterUqName";
import Loader from "../components/Loader";
import UqHeader from "../components/UqHeader"
import { PageProps } from "../lib/types";

global.Buffer = global.Buffer || require('buffer').Buffer;

const {
  useAccounts,
  useProvider,
} = hooks;

interface ClaimUqNameProps extends PageProps {

}

function ClaimUqInvite({ direct, setDirect, setUqName, uqNft, openConnect, networkingKey, ipAddress, port, routers }: ClaimUqNameProps) {
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('')
  const [triggerNameCheck, setTriggerNameCheck] = useState<boolean>(false)
  const [invite, setInvite] = useState('');
  const [inviteValidity, setInviteValidity] = useState('');
  const [name, setName] = useState('');
  const [nameValidities, setNameValidities] = useState<string[]>([])

  useEffect(()=> setTriggerNameCheck(!triggerNameCheck), [provider])

  useEffect(() => {
    (async() => {

      if (invite !== "") {

        const url = process.env.REACT_APP_INVITE_GET + invite

        const response = await fetch(url, { method: 'GET', })

        if (response!.status === 200) {
          setInviteValidity("")
        } else {
          setInviteValidity(await response.text())
        }
      }

    })()
  }, [invite])

  let handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!provider) return openConnect()

    if (nameValidities.length !== 0 || inviteValidity !== '') return
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
      alert(e)
      console.error("error from broadcasting userOp:", e);
      return;

    } finally {
      setLoaderMsg('')
      setIsLoading(false);
    }

    setUqName(`${name}.uq`);

    navigate("/set-password");
  }

  const enterUqNameProps = { name, setName, nameValidities, setNameValidities, uqNft, triggerNameCheck }

  return (
    <>
      <UqHeader msg="Claim Uqbar Invite" openConnect={openConnect} />
      {Boolean(provider) && <form id="signup-form" className="col" onSubmit={handleRegister}>
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
              { inviteValidity !== "" && <div className="invite-validity">{inviteValidity}</div> }
            </div>

            <EnterUqName { ...enterUqNameProps } />

            <div className="row" style={{ marginTop: '1em' }}>
              <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
              <label htmlFor="direct" className="direct-node-message">
                Register as a direct node (only do this if you are hosting your node somewhere stable)
              </label>
            </div>

            <button disabled={nameValidities.length !== 0 || inviteValidity !== ''} type="submit" >
                Register Uqname
            </button>

            <Link to="/reset" style={{ color:"white", marginTop: '1em' }}>already have an uq-name?</Link>
          </>
        }
      </form>}
    </>
  )
}

export default ClaimUqInvite;
