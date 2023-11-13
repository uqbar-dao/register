import { useNavigate } from "react-router-dom"
import UqHeader from "../components/UqHeader"

type UqHomeProps = {
    openConnect: () => void
    provider: any
    uqName: string
}

function UqHome ({ openConnect, uqName, provider }: UqHomeProps) {
    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const resetRedir = () => navigate('/reset')
    const importKeyfileRedir = () => navigate('/import-keyfile')
    const loginRedir = () => navigate('/login')

    const previouslyBooted = Boolean(uqName)

    return (
        <>
        <UqHeader msg="Welcome to Uqbar" openConnect={openConnect} hideConnect />
        <div style={{ maxWidth: 'calc(100vw - 32px)', width: 420 }}>
            {!previouslyBooted && <button onClick={inviteRedir}> Claim Uq Invite </button>}
            {!previouslyBooted && <button onClick={registerRedir}> Register UqName </button>}
            <button onClick={resetRedir}> Reset UqName </button>
            {!previouslyBooted && <button onClick={importKeyfileRedir}> Import Keyfile </button>}
            {previouslyBooted && <button onClick={loginRedir}> Login </button>}
        </div>
        </>
    )
}

export default UqHome