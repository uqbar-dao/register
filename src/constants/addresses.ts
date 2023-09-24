import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0xfd571a1a8Ba4bAe58f5729aF52E2ED7277ed3DF2',
}

export const UQ_NFT_ADDRESSES : AddressMap = {
    [ChainId.OPTIMISM_GOERLI]: '0x38caCBCa528Be71feF883f9237304432DD6966dF'
}
