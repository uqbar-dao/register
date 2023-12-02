import { useCallback } from 'react';
import { hooks, metaMask } from "../connectors/metamask";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from '@web3-react/core';
import Modal from "react-modal"
import { SEPOLIA_OPT_HEX, SEPOLIA_OPT_INT } from '../constants/chainId';

const {
  useIsActivating,
  useIsActive,
} = hooks;

type ConnectWalletProps = {
  connectOpen: boolean,
  closeConnect: () => void
}

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

export default function ConnectWallet({ connectOpen, closeConnect }: ConnectWalletProps) {
  const isActivating = useIsActivating();
  const isActive = useIsActive();

  const connect = useCallback(async () => {
    closeConnect()
    await metaMask.activate().catch(() => {})

    try {
      const networkId = String(await (window.ethereum as any)?.request({ method: 'net_version' }).catch(() => '0x1'))

      if (networkId !== SEPOLIA_OPT_HEX && networkId !== SEPOLIA_OPT_INT) {
        const SEPOLIA_DETAILS = {
          chainId: '0xaa36a7', // Replace with the correct chainId for Sepolia
          chainName: 'Sepolia Test Network',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://sepolia-infura.brave.com/'], // Replace with Sepolia's RPC URL
          blockExplorerUrls: ['https://sepolia.etherscan.io'] // Replace with Sepolia's block explorer URL
        };

        await (window.ethereum as any)?.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_DETAILS]
        })
      }
    } catch (err) {
      console.error('FAILED TO ADD SEPOLIA:', err)
    }
  }, [closeConnect]);

  return (
    <Modal
      isOpen={connectOpen}
      onRequestClose={closeConnect}
      className="connect-modal"
      overlayClassName="overlay-modal"
    >
      <div className="connect-modal-content">
        <button onClick={connect} disabled={isActivating} >
          Connect to Wallet
        </button>
      </div>
    </Modal>
  );
}