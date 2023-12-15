import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.SEPOLIA]: '0x1C5595336Fd763a81887472D30D6CbD736Acf0E3',
}

export const DOT_UQ_ADDRESSES : AddressMap = {
    [ChainId.SEPOLIA]: '0xC0deB2E3F2500289c0898C0DF3BDFb6E7da22c1D'
}
