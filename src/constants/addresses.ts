import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xA3632491a65b9F7f36Fb3E77B8191DE9e172E0F8',
    [ChainId.SEPOLIA]: '0x9e5ed0e7873E0d7f10eEb6dE72E87fE087A12776',
}

export const UQ_NFT_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xA3632491a65b9F7f36Fb3E77B8191DE9e172E0F8',
    [ChainId.SEPOLIA]: '0xA855B1F82127158bE35dF4a7867D9a3d7fc5166c'
}
