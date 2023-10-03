import { useCallback } from 'react';
import { hooks, metaMask } from "../connectors/metamask";

const SEPOLIA_OPT_HEX = '0xaa36a7';
const SEPOLIA_OPT_INT = '11155111';

const {
  useIsActivating,
  useIsActive,
} = hooks;

export default function ConnectWallet() {
  const isActivating = useIsActivating();
  const isActive = useIsActive();

  const activate = useCallback(async () => {
    await metaMask.activate().catch(() => {})

    try {
      const networkId = String(await (window.ethereum as any)?.request({ method: 'net_version' }).catch(() => '0x1'))

      console.log('networkId', networkId)

      if (networkId !== SEPOLIA_OPT_HEX && networkId !== SEPOLIA_OPT_INT) {
        const SEPOLIA_DETAILS = {
          chainId: '0xaa36a7', // Replace with the correct chainId for Sepolia
          chainName: 'Sepolia',
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
  }, []);

  return (
    <div>
      <div/>
      {!isActive && (
        <button
          onClick={async () => await metaMask.activate()}
          disabled={isActivating}
        >
          Connect
        </button>
      )}
    </div>
  );
}
