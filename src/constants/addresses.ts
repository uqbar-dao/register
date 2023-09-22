import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xb598fe1771DB7EcF2AeD06f082dE1030CA0BF1DA',
}

export const UQ_NFT_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0x7F98DC18f2e2349D18C90879B2677b7CC868c3ff'
}
