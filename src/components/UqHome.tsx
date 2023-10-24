import { useNavigate } from "react-router-dom"
import UqHeader from "./UqHeader"

type UqHomeProps = {
    openConnect: () => void
    provider: any
}
function UqHome ({ openConnect, provider }: UqHomeProps) {
    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const loginRedir = () => navigate('/login')
    const resetRedir = () => navigate('/reset')

    return (
        <>
        <UqHeader msg="Welcome to Uqbar" openConnect={openConnect}/>
        {Boolean(provider) && <div style={{ minWidth: '50vw', width: 400 }}>
            <button onClick={inviteRedir}> Claim Uq Invite </button>
            <button onClick={registerRedir}> Register Uqname </button>
            <button onClick={loginRedir}> Login </button>
            <button onClick={resetRedir}> Reset </button>
        </div>}
        </>
    )
}

export default UqHome