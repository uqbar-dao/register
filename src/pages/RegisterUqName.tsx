import React, { useState, useEffect, FormEvent, useCallback } from "react";
import { hooks } from "../connectors/metamask";
import { Link, useNavigate } from "react-router-dom";
import { toDNSWireFormat } from "../utils/dnsWire";
import { utils } from 'ethers';
import EnterUqName from "../components/EnterUqName";
import Loader from "../components/Loader";
import UqHeader from "../components/UqHeader";
import { PageProps } from "../lib/types";

const {
  useAccounts,
} = hooks;

interface RegisterUqNameProps extends PageProps {

}

function RegisterUqName({ direct, setDirect, setUqName, uqNft, qns, openConnect, provider, networkingKey, ipAddress, port, routers, closeConnect }: RegisterUqNameProps) {
  let accounts = useAccounts();
  let navigate = useNavigate();
  const [loading, setLoading] = useState('');

  const [name, setName] = useState('')
  const [nameValidities, setNameValidities] = useState<string[]>([])

  const [triggerNameCheck, setTriggerNameCheck] = useState<boolean>(false)

  useEffect(() => setTriggerNameCheck(!triggerNameCheck), [provider]) // eslint-disable-line react-hooks/exhaustive-deps

  const enterUqNameProps = { name, setName, nameValidities, setNameValidities, uqNft, triggerNameCheck }

  let handleRegister = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!provider) return openConnect()

    try {
      setLoading('Please confirm the transaction in your wallet');

      const wsTx = await qns.populateTransaction.setWsRecord(
          utils.namehash(`${name}.uq`),
          networkingKey,
          direct ? ipAddress : 0,
          direct ? port : 0,
          !direct ? routers.map(x => utils.namehash(x)) : []
      )

      setLoading('Registering QNS ID...');

      const dnsFormat = toDNSWireFormat(`${name}.uq`);
      const tx = await uqNft.register(
        dnsFormat,
        accounts![0],
        [ wsTx.data! ]
      )

      await tx.wait();
      setLoading('');
      setUqName(`${name}.uq`);
      navigate("/set-password");
    } catch {
      setLoading('');
    }
  }, [name, direct, networkingKey, ipAddress, port, routers, accounts, uqNft, qns, navigate, setUqName, provider, openConnect])

  return (
    <>
      <UqHeader msg="Register Uqbar Node" openConnect={openConnect} closeConnect={closeConnect} />
      {Boolean(provider) && <form id="signup-form" className="col" onSubmit={handleRegister}>
        {loading ? (
          <Loader msg={loading} />
        ) : (
          <>
            <div className="login-row row" style={{ marginBottom: '1em', lineHeight: 1.5 }}>
              Set up your Uqbar node with a .uq name
              <div className="tooltip-container" style={{ marginTop: -4 }}>
                <div className="tooltip-button">&#8505;</div>
                <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
              </div>
            </div>
            <EnterUqName { ...enterUqNameProps } />
            <div className="row" style={{ marginTop: '1em' }}>
              <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)} autoFocus/>
              <label htmlFor="direct" className="direct-node-message">
                Direct nodes must have a static IP. If you are unsure leave unchecked.

                <div className="tooltip-container">
                  <div className="tooltip-button">&#8505;</div>
                  <div className="tooltip-content">A direct node publishes its own networking information on-chain: IP, port, so on.
                    An indirect node relies on the service of routers, which are themselves direct nodes.
                    Only register a direct node if you know what you’re doing and have a public, static IP address.</div>
                </div>
              </label>
            </div>
            <button disabled={nameValidities.length !== 0} type="submit">
              Register Uqname
            </button>
            <Link to="/reset" style={{ color:"white", marginTop: '1em' }}>already have an uq-name?</Link>
          </>
        )}
      </form>}
    </>
  )
}

export default RegisterUqName;
