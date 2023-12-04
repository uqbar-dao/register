import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import { toAscii } from 'idna-uts46-hx'
import { hash } from 'eth-ens-namehash'
import isValidDomain from 'is-valid-domain'
import Loader from "../components/Loader";
import UqHeader from "../components/UqHeader";
import { NetworkingInfo, PageProps } from "../lib/types";
import { ipToNumber } from "../utils/ipToNumber";

const NAME_INVALID_PUNY = "Unsupported punycode character"
const NAME_NOT_OWNER = "Name does not belong to this wallet"
const NAME_NOT_REGISTERED = "Name is not registered"
const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"

const {
  useAccounts,
  useProvider,
} = hooks;

interface ResetProps extends PageProps {

}

function Reset({
  direct,
  setDirect,
  setReset,
  uqName,
  setUqName,
  dotUq,
  qns,
  openConnect,
  closeConnect,
  setNetworkingKey,
  setIpAddress,
  setPort,
  setRouters
}: ResetProps) {
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [name, setName] = useState<string>(uqName.slice(0,-3));
  const [nameVets, setNameVets] = useState<string[]>([]);
  const [loading, setLoading] = useState<string>('');

  const [ triggerNameCheck, setTriggerNameCheck ] = useState<boolean>(false)

  // so inputs will validate once wallet is connected
  useEffect(() => setTriggerNameCheck(!triggerNameCheck), [provider]) // eslint-disable-line react-hooks/exhaustive-deps

  const nameDebouncer = useRef<NodeJS.Timeout | null>(null)
  useEffect(()=> {

    if (nameDebouncer.current)
      clearTimeout(nameDebouncer.current);

    nameDebouncer.current = setTimeout(async () => {
        setNameVets([]);

        if (!provider) return

        if (name === "") return

        let index: number
        let vets = [...nameVets]

        let normalized: string
        index = vets.indexOf(NAME_INVALID_PUNY)
        try {
          normalized = toAscii(name + ".uq")
          if (index !== -1) vets.splice(index, 1)
        } catch (e) {
          if (index === -1) vets.push(NAME_INVALID_PUNY)
        }

        // only check if name is valid punycode
        if (normalized! !== undefined) {

          index = vets.indexOf(NAME_URL)
          if (name !== "" && !isValidDomain(normalized)) {
            if (index === -1) vets.push(NAME_URL)
          } else if (index !== -1) vets.splice(index, 1)

          try {

            const owner = await dotUq.ownerOf(hash(normalized))

            index = vets.indexOf(NAME_NOT_OWNER)
            if (owner === accounts![0] && index !== -1)
              vets.splice(index, 1);
            else if (index === -1 && owner !== accounts![0])
              vets.push(NAME_NOT_OWNER);

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index !== -1) vets.splice(index, 1)

          } catch (e) {

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index === -1) vets.push(NAME_NOT_REGISTERED)

          }

          if (nameVets.length === 0)
            setUqName(normalized)

        }

        setNameVets(vets)

    }, 500)

  }, [name, triggerNameCheck]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResetRecords = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!provider) return openConnect()

    try {
      setLoading("Please confirm the transaction in your wallet");

      const { networking_key, ws_routing: [ip_address, port], allowed_routers } =
        (await fetch('/generate-networking-info', { method: 'POST' }).then(res => res.json())) as NetworkingInfo

      const ipAddress = ipToNumber(ip_address)

      setNetworkingKey(networking_key)
      setIpAddress(ipAddress)
      setPort(port)
      setRouters(allowed_routers)

      const data = [
        direct 
          ? ( await qns.populateTransaction.setRouters
            (namehash(uqName), allowed_routers.map(x => namehash(x)))).data!
          : ( await qns.populateTransaction.setAllIp
              (namehash(uqName), ipAddress, port, 0, 0, 0)).data!,
        ( await qns.populateTransaction.setKey(namehash(uqName), networking_key)).data!,
      ];

      const tx = await qns.multicall(data)

      setLoading("Resetting Networking Information...");

      await tx.wait();

      setReset(true);
      setLoading('');
      setDirect(direct);
      navigate('/set-password');
    } catch {
      setLoading('');
      alert('An error occurred, please try again.')
    }
  }, [provider, uqName, setReset, setDirect, navigate, openConnect, qns, direct, setNetworkingKey, setIpAddress, setPort, setRouters])

  return (
    <>
      <UqHeader msg="Reset Uqbar Node" openConnect={openConnect} closeConnect={closeConnect} />
      {Boolean(provider) && <form id="signup-form" className="col" onSubmit={handleResetRecords}>
      { loading ? <Loader msg={loading}/> : <>
        <div className="login-row row">
          Enter .uq Name
          <div className="tooltip-container">
            <div className="tooltip-button">&#8505;</div>
            <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
          </div>
        </div>

        <div className="col" style={{ width: '100%' }}>
          <div style={{display:'flex', alignItems:'center', width: '100%', marginBottom: '0.5em'}}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              name="uq-name"
              placeholder="e.g. myname"
              style={{ width: '100%', marginRight: 8, }}
            />
            .uq
          </div>
          { nameVets.map((x,i) => <span key={i} className="name-err">{x}</span>) }
        </div>

        <div className="row">
          <input type="checkbox" id="direct" name="direct" checked={direct} onChange={(e) => setDirect(e.target.checked)}/>
          <label htmlFor="direct" className="direct-node-message">
            Register as a direct node. If you are unsure leave unchecked.
            <div className="tooltip-container">
              <div className="tooltip-button">&#8505;</div>
              <div className="tooltip-content">A direct node publishes its own networking information on-chain: IP, port, so on.
                An indirect node relies on the service of routers, which are themselves direct nodes.
                Only register a direct node if you know what you’re doing and have a public, static IP address.</div>
            </div>
          </label>
        </div>

        <button type="submit"> Reset Networking Keys </button>

        </>
      }
      </form>}
    </>
  )
}

export default Reset;
