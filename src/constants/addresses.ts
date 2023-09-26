import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    // [ChainId.OPTIMISM_GOERLI]: '0xfd571a1a8Ba4bAe58f5729aF52E2ED7277ed3DF2',
    [ChainId.SEPOLIA]: '0x9e5ed0e7873E0d7f10eEb6dE72E87fE087A12776',
}

export const UQ_NFT_ADDRESSES : AddressMap = {
    // [ChainId.OPTIMISM_GOERLI]: '0x38caCBCa528Be71feF883f9237304432DD6966dF',
    [ChainId.SEPOLIA]: '0xA855B1F82127158bE35dF4a7867D9a3d7fc5166c'
}
