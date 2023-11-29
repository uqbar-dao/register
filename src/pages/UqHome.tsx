import { useNavigate } from "react-router-dom"
import UqHeader from "../components/UqHeader"

type UqHomeProps = {
    openConnect: () => void
    provider: any
    uqName: string
    closeConnect: () => void
}

function UqHome ({ openConnect, uqName, provider, closeConnect }: UqHomeProps) {
    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const resetRedir = () => navigate('/reset')
    const importKeyfileRedir = () => navigate('/import-keyfile')
    const loginRedir = () => navigate('/login')

    const previouslyBooted = Boolean(uqName)

    const hasNetwork = Boolean(window.ethereum)

    return (
        <>
            <UqHeader msg="Welcome to Uqbar" openConnect={openConnect} closeConnect={closeConnect} hideConnect />
            <div style={{ maxWidth: 'calc(100vw - 32px)', width: 420 }}>
                {previouslyBooted ? (
                    <button onClick={loginRedir}> Login </button>
                ) : (
                    <>
                        {!hasNetwork && <h4 style={{ marginBottom: '0.5em', fontSize: '0.8em' }}>
                            You must install a Web3 wallet extension like Metamask in order to register or reset a username.
                        </h4>}
                        {hasNetwork && <h4 style={{ marginBottom: '0.5em' }}>New here? Register a username to get started</h4>}
                        <button disabled={!hasNetwork} onClick={registerRedir}> Register UqName </button>
                        <br/>
                        <h4 style={{ marginBottom: '0.5em' }}>Other options</h4>
                        <button disabled={!hasNetwork} onClick={inviteRedir}> Claim Uq Invite </button>
                        <button disabled={!hasNetwork} onClick={resetRedir}> Reset UqName </button>
                        <button onClick={importKeyfileRedir}> Import Keyfile </button>
                    </>
                )}
            </div>
        </>
    )
}

export default UqHome