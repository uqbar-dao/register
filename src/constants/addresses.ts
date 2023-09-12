import { ChainId } from './chainId'

type AddressMap = { [chainId: number]: string }

export const QNS_REGISTRY_ADDRESSES : AddressMap = {
    [ChainId.LOCAL] : '0x2B2f78c5BF6D9C12Ee1225D5F374aa91204580c3',
    [ChainId.OPTIMISM_GOERLI]: '0xdFbC22778887649378f2DEcB24956144E5247c0b',
}

export const PUBLIC_RESOLVER_ADDRESSES : AddressMap = {
    [ChainId.LOCAL] : '0xa2F6E6029638cCb484A2ccb6414499aD3e825CaC',
    [ChainId.OPTIMISM_GOERLI]: '0x82edbff907b5B8693abC6e5bA4bAc1d03C0f0b22'
}

export const FIFS_REGISTRAR_ADDRESSES : AddressMap = {
    [ChainId.LOCAL] : '0xD2547e4AA4f5a2b0a512BFd45C9E3360FeEa48Df',
    [ChainId.OPTIMISM_GOERLI] : '0x01C3366bb20DA47c6e76281bDCcc914d05e578d0',
}
