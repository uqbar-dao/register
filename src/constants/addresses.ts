import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xbAc9D2172945355992Dc47E3C5A10968CBB2350d',
    [ChainId.SEPOLIA]: '0x9e5ed0e7873E0d7f10eEb6dE72E87fE087A12776',
}

export const UQ_NFT_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xbfde9EC413c5ac4c137BDfe661f4747882F9D669',
    [ChainId.SEPOLIA]: '0xA855B1F82127158bE35dF4a7867D9a3d7fc5166c'
}
