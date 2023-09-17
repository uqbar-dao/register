import React from "react";
import { hooks } from "../connectors/metamask";
import { PublicResolver__factory } from "../abis/types";
import { PUBLIC_RESOLVER_ADDRESSES } from "../constants/addresses";
import type { Identity } from "../App";
import { namehash } from "@ethersproject/hash";

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

  if (!chainId) return <p>connect your wallet</p>
  if (!provider) return <p>idk whats wrong</p>
  if (!(chainId in PUBLIC_RESOLVER_ADDRESSES)) return <p>change networks</p>
  let publicResolverAddress = PUBLIC_RESOLVER_ADDRESSES[chainId!];
  let publicResolver = PublicResolver__factory.connect(publicResolverAddress, provider.getSigner());

  return (
    <div id="signup-form" className="col">
      <div className="row" style={{margin: "0 0 1em"}}>
        <button
          onClick={
            async () => {
              const tx = await publicResolver.setWs(
                `${namehash(our.name)}`,
                `0x${our.networking_key}`,
                our.ws_routing? our.ws_routing.ip : 0,
                our.ws_routing? our.ws_routing.port: 0,
                our.allowed_routers,
              )
              await tx.wait();
              console.log('adsf', tx)
              setDone(true);
            }
          }
        >
          Set QNS Networking
        </button>
      </div>
    </div>
  )
}

export default SetWs;
