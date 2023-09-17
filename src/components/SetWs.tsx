import React, { useState } from "react";
import { hooks } from "../connectors/metamask";
import { PublicResolver__factory } from "../abis/types";
import { PUBLIC_RESOLVER_ADDRESSES } from "../constants/addresses";
import type { Identity } from "../App";
import { namehash } from "@ethersproject/hash";
import Loader from "./Loader";

const {
  useChainId,
  useProvider,
} = hooks;

type SetWsProps = {
  our: Identity
  setDone: React.Dispatch<React.SetStateAction<boolean>>
}


function SetWs({ our, setDone }: SetWsProps) {
  let chainId = useChainId();
  let provider = useProvider();
  let [isLoading, setIsLoading] = useState(false);

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in PUBLIC_RESOLVER_ADDRESSES)) return <p>change networks</p>
  let publicResolverAddress = PUBLIC_RESOLVER_ADDRESSES[chainId!];
  let publicResolver = PublicResolver__factory.connect(publicResolverAddress, provider.getSigner());

  let handleRegister = async () => {
    const tx = await publicResolver.setWs(
      `${namehash(our.name)}`,
      `0x${our.networking_key}`,
      our.ws_routing? our.ws_routing.ip : 0,
      our.ws_routing? our.ws_routing.port: 0,
      our.allowed_routers,
    )
    setIsLoading(true);
    await tx.wait();
    setIsLoading(false);
    setDone(true);
  }

  return (
    <div id="signup-form" className="col">
      {
        isLoading? <Loader msg="Setting Networking Keys"/> :
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
