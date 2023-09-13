import { hooks, metaMask } from "../connectors/metamask";

const {
  useIsActivating,
  useIsActive,
} = hooks;

export default function ConnectWallet() {
  const isActivating = useIsActivating();
  const isActive = useIsActive();

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
