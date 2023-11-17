import React, { FormEvent, useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import { toAscii } from 'idna-uts46-hx'
import { hash } from 'eth-ens-namehash'
import isValidDomain from 'is-valid-domain'
import Loader from "../components/Loader";
import UqHeader from "../components/UqHeader";
import { PageProps } from "../lib/types";

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

function Reset({ direct, setDirect, networkingKey, ipAddress, port, routers, pw, setReset, uqName, setUqName, uqNft, qns, openConnect }: ResetProps) {
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [name, setName] = useState<string>(uqName.slice(0,-3));
  const [nameVets, setNameVets] = useState<string[]>([]);
  const [loading, setLoading] = useState<string>('');

  const [ triggerNameCheck, setTriggerNameCheck ] = useState<boolean>(false)

  // so inputs will validate once wallet is connected
  useEffect(() => setTriggerNameCheck(!triggerNameCheck), [provider])

  const nameDebouncer = useRef<NodeJS.Timeout | null>(null)
  useEffect(()=> {

    if (nameDebouncer.current)
      clearTimeout(nameDebouncer.current);

    nameDebouncer.current = setTimeout(async () => {

        if (!provider) return

        if (name === "") { setNameVets([]); return; }

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

            const owner = await uqNft.ownerOf(hash(normalized))

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

  }, [name, triggerNameCheck])

  const handleLogin = async () => {
    const response = await fetch('/boot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reset: true,
        password: pw,
        username: `${name}.uq`,
        direct
      })
    })

    const base64Keyfile = await response.json()
    let blob = new Blob([base64Keyfile], {type: "text/plain;charset=utf-8"});
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name}.uq.keyfile`)
    document.body.appendChild(link);
    link.click();

    const interval = setInterval(async () => {
      const homepageResult = await fetch('/')
      if (homepageResult.status < 400) {
        clearInterval(interval)
        window.location.replace('/')
      }
    }, 2000);

  };

  const handleResetRecords = (asDirect: boolean) => async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!provider) return openConnect()

    try {
      setLoading("Please confirm the transaction in your wallet");

      const tx = await qns.setWsRecord(
        namehash(uqName),
        networkingKey,
        asDirect ? ipAddress : 0,
        asDirect ? port : 0,
        asDirect ? [] : routers.map(x => namehash(x))
      )

      setLoading("Resetting Websocket Information...");

      await tx.wait();

      if (pw) handleLogin();
      else {
        setReset(true);
        setLoading('');
        setDirect(asDirect);
        navigate('/set-password');
      }
    } catch {
      setLoading('');
      alert('An error occurred, please try again.')
    }
  }

  return (
    <>
      <UqHeader msg="Reset Uqbar Node" openConnect={openConnect} />
      {Boolean(provider) && <form id="signup-form" className="col" onSubmit={handleResetRecords(direct)}>
      { loading ? <Loader msg={loading}/> : <>
        <div className="login-row row">
          Enter .Uq Name
          <div className="tooltip-container">
            <div className="tooltip-button">&#8505;</div>
            <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
          </div>
        </div>

        <div className="col" style={{ width: '100%' }}>
          <div style={{display:'flex', alignItems:'center', width: '100%', marginBottom: '1em'}}>
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
            Reset as a direct node (only do this if you are hosting your node somewhere stable)
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