import { hooks, metaMask } from "../connectors/metamask";

const {
  useChainId,
  useAccounts,
  useIsActivating,
  useIsActive,
} = hooks;

export default function ConnectWallet() {
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActivating = useIsActivating();
  const isActive = useIsActive();

  return (
    <div>
      <div/>
      {isActive ? (
        <>
          <p>{accounts}</p>
          <p>{chainId}</p>
        </>
      ) : (
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
