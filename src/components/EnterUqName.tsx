import React, { useState, useEffect } from "react";
import { hooks } from "../connectors/metamask";
import { UqNFT__factory } from "../abis/types";
import {
  UQ_NFT_ADDRESSES,
} from "../constants/addresses";
import Loader from "./Loader";
import { Link, useNavigate } from "react-router-dom";
import * as punycode from 'punycode/';
import isValidDomain from 'is-valid-domain'
import { hash, normalize } from 'eth-ens-namehash'
import { toAscii } from 'idna-uts46-hx'

global.Buffer = global.Buffer || require('buffer').Buffer;

const {
  useChainId,
  useProvider,
} = hooks;

type ClaimUqNameProps = {
  name: string,
  setName: React.Dispatch<React.SetStateAction<string>>
  nameValidities: string[],
  setNameValidities: React.Dispatch<React.SetStateAction<string[]>>
}

function EnterUqName({ 
  name, 
  setName,
  nameValidities,
  setNameValidities
 }: ClaimUqNameProps) {

  const chainId = useChainId()
  const provider = useProvider()

  let uqNft = UqNFT__factory.connect(
    UQ_NFT_ADDRESSES[chainId!],
    provider!.getSigner()
  )

  const NAME_URL = "Name must be a valid URL without subdomains (A-Z, a-z, 0-9, and punycode)"
  const NAME_LENGTH = "Name must be 9 characters or more"
  const NAME_CLAIMED = "Name is already claimed"
  const NAME_INVALID_PUNY = "Unsupported punycode character"

  useEffect( () => {
    (async() => {

      let index
      let validities = [...nameValidities]

      const len = [...name].length
      index = validities.indexOf(NAME_LENGTH)
      if (len < 9)  {
        if (index == -1) validities.push(NAME_LENGTH)
      } else if (index != -1) validities.splice(index, 1)

      let normalized: string
      index = validities.indexOf(NAME_INVALID_PUNY)
      try {
        normalized = toAscii(name + ".uq")
        if (index != -1) validities.splice(index, 1)
      } catch (e) {
        if (index == -1) validities.push(NAME_INVALID_PUNY)
      }

      // only check if name is valid punycode
      if (normalized! !== undefined) {

        index = validities.indexOf(NAME_URL)
        if (name != "" && !isValidDomain(normalized)) {
          if (index == -1) validities.push(NAME_URL)
        } else if (index != -1) validities.splice(index, 1)

        index = validities.indexOf(NAME_CLAIMED)
        if (validities.length == 0 || index != -1) {
          try {
            await uqNft.ownerOf(hash(normalized))
            if (index == -1) validities.push(NAME_CLAIMED)
          } catch (e) {
            if (index != -1) validities.splice(index, 1)
          }
        }
      }

      setNameValidities(validities)

    })()
  }, [name])

    return (
      <div className="row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          required
          name="uq-name"
          placeholder="e.g. myname"
        />
        <div className="uq">.uq</div>
        { nameValidities.map((x,i) => <div><br/><span key={i} className="name-validity">{x}</span></div>) }
      </div>
    )

}

export default EnterUqName;
