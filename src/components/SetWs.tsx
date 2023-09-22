import React, { useState } from "react";
import { hooks } from "../connectors/metamask";
import { QNSRegistry__factory } from "../abis/types";
import { QNS_REGISTRY_ADDRESSES } from "../constants/addresses";
import type { Identity } from "../App";
import { namehash } from "@ethersproject/hash";
import Loader from "./Loader";
import { ipToNumber } from "../utils/ipToNumber";

const {
  useChainId,
  useProvider,
} = hooks;

type SetWsProps = {
  our: Identity
}


function SetWs({ our }: SetWsProps) {
  let chainId = useChainId();
  let provider = useProvider();
  let [isLoading, setIsLoading] = useState(false);

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in QNS_REGISTRY_ADDRESSES)) return <p>change networks</p>
  let qnsRegistryAddress = QNS_REGISTRY_ADDRESSES[chainId!];
  let qnsRegistry = QNSRegistry__factory.connect(qnsRegistryAddress, provider.getSigner());

  let handleRegister = async () => {
    // TODO handle transaction rejected
    const tx = await qnsRegistry.setWsRecord(
      `${namehash(our.name)}`,
      `0x${our.networking_key}`,
      our.ws_routing? ipToNumber(our.ws_routing[0]) : 0, // TODO need to convert ip to a uint48!
      our.ws_routing? our.ws_routing[1]: 0,
      our.allowed_routers,
    )
    setIsLoading(true);
    await tx.wait();
    await fetch('/get-ws-info', {
        method: 'PUT',
    })
    const interval = setInterval(async () => {
        const homepageResult = await fetch('/')
        if (homepageResult.status < 400) {
          clearInterval(interval)
          window.location.replace('/')
        }
      }, 2000);
  }

  return (
    <div id="signup-form" className="col">
      {
        isLoading? <Loader msg="Booting Node"/> :
        <div className="row" style={{margin: "0 0 1em"}}>
          <button onClick={handleRegister}>
            Set QNS Networking
          </button>
        </div>
      }
    </div>
  )
}

export default SetWs;
