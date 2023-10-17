import React, { useEffect, useRef, useState } from "react";
import { hooks } from "../connectors/metamask";
import { UQ_NFT_ADDRESSES } from "../constants/addresses";
import { UqNFT__factory } from "../abis/types";
import { useNavigate } from "react-router-dom";
import { namehash } from "ethers/lib/utils";
import { ipToNumber } from "../utils/ipToNumber";
import { toAscii } from 'idna-uts46-hx'
import { hash } from 'eth-ens-namehash'
import isValidDomain from 'is-valid-domain'

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;

type LoginProps = {
  direct: boolean,
  setDirect: React.Dispatch<React.SetStateAction<boolean>>,
  setConfirmedUqName: React.Dispatch<React.SetStateAction<string>>
}

function Login({ direct, setDirect, setConfirmedUqName }: LoginProps) {
  const chainId = useChainId();
  const accounts = useAccounts();
  const provider = useProvider();
  const navigate = useNavigate();

  const [networkingKey, setNetworkingKey] = useState<string>('');
  const [ipAddr, setIpAddr] = useState<number>(0);
  const [port, setPort] = useState<number>(0);
  const [routers, setRouters] = useState<string[]>([]);

  const [needKey, setNeedKey] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [nameVets, setNameVets] = useState<string[]>([]);

  const [key, setKey] = useState<string>('');

  const [pw, setPw] = useState<string>('');
  const [pw2, setPw2] = useState<string>('');

  useEffect(() => {
    (async () => {

      let response = await fetch('/info', { method: 'GET' })
      let data = await response.json()
      setNetworkingKey(data.networking_key)
      setRouters(data.allowed_routers)
      setIpAddr(ipToNumber(data.ws_routing[0]))
      setPort(data.ws_routing[1])

      response = await fetch('/has-keyfile', { method: 'GET'})
      data = await response.json()
      setNeedKey(data)

    })()
  }, [])

  const debouncer = useRef<NodeJS.Timeout | null>(null)

  const NAME_INVALID_PUNY = "Unsupported punycode character"
  const NAME_NOT_OWNER = "Name does not belong to this wallet"
  const NAME_NOT_REGISTERED = "Name is not registered"
  const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"

  useEffect(()=> {
    if (debouncer.current) 
      clearTimeout(debouncer.current);

    debouncer.current = setTimeout(async () => {

        if (name == "") {
          setNameVets([])
          return;
        }

        let index: number
        let vets = [...nameVets]

        let normalized: string
        index = vets.indexOf(NAME_INVALID_PUNY)
        try {
          normalized = toAscii(name + ".uq")
          if (index != -1) vets.splice(index, 1)
        } catch (e) {
          if (index == -1) vets.push(NAME_INVALID_PUNY)
        }

        // only check if name is valid punycode
        if (normalized! !== undefined) {

          index = vets.indexOf(NAME_URL)
          if (name != "" && !isValidDomain(normalized)) {
            if (index == -1) vets.push(NAME_URL)
          } else if (index != -1) vets.splice(index, 1)

          try {

            const owner = await uqNft.ownerOf(hash(normalized))

            index = vets.indexOf(NAME_NOT_OWNER)
            if (owner == accounts![0] && index != -1) 
              vets.splice(index, 1);
            else if (index == -1 && owner != accounts![0])
              vets.push(NAME_NOT_OWNER);

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index != -1) vets.splice(index, 1)

          } catch {

            index = vets.indexOf(NAME_NOT_REGISTERED)
            if (index == -1) vets.push(NAME_NOT_REGISTERED)

          }
        }

        setNameVets(vets)

    }, 500)

  }, [name])

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in UQ_NFT_ADDRESSES)) return <p>change networks</p>
  let uqNftAddress = UQ_NFT_ADDRESSES[chainId];
  let uqNft = UqNFT__factory.connect(uqNftAddress, provider.getSigner());

  return (
    <div id="signup-form" className="col">
      <div className="row">
        <h4>What is your .uq name?</h4>
        <div className="tooltip-container">
          <div className="tooltip-button">&#8505;</div>
          <div className="tooltip-content">Uqbar nodes use a .uq name in order to identify themselves to other nodes in the network</div>
        </div>
      </div>
      <div className="row" style={{margin: "0 0 1em"}}>
          <div style={{fontSize: "0.75em"}}>Address:</div>
          {accounts && <div id="current-address">{accounts[0]}</div>}
        </div>
      <div className="row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          minLength={9}
          required
          name="uq-name"
          placeholder="e.g. myname"
        />
        <div className="uq">.uq</div>
        { nameVets.map((x,i) => <div><br/><span key={i} className="name-validity">{x}</span></div>) }
      </div>
    </div>
  )
}

export default Login;