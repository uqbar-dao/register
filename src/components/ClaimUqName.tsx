import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { QNSRegistry__factory } from "../abis/types";
import { QNS_REGISTRY_ADDRESSES, PUBLIC_RESOLVER_ADDRESSES } from "../constants/addresses";

const {
  useChainId,
  useAccounts,
  useProvider,
} = hooks;


function ClaimUqName() {
  let chainId = useChainId();
  let accounts = useAccounts();
  let provider = useProvider();

  if (!chainId) return <></>
  if (!provider) return <></>
  if (!(chainId in QNS_REGISTRY_ADDRESSES)) return <></>
  if (!(chainId in PUBLIC_RESOLVER_ADDRESSES)) return <></>
  let qnsRegistryAddress = QNS_REGISTRY_ADDRESSES[chainId];
  let publicResolverAddress = PUBLIC_RESOLVER_ADDRESSES[chainId!];
  let qnsRegistry = QNSRegistry__factory.connect(qnsRegistryAddress, provider.getSigner());

  return (
    <div>
      <button
        onClick={
          async () => {
            const tx = await qnsRegistry.setSubnodeRecord(
              "0x046d656d6502757100",
              accounts![0],
              publicResolverAddress,
              69000,
            )
            await tx.wait();
            console.log('adsf', tx)
          }
        }
      >Register Uqname with {accounts![0]}</button>
    </div>
  )
}

export default ClaimUqName;
