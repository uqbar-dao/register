import { useNavigate } from "react-router-dom"
import UqHeader from "./UqHeader"

type UqHomeProps = {
    openConnect: () => void
}
function UqHome ({ openConnect }: UqHomeProps) {

    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const loginRedir = () => navigate('/login')
    const resetRedir = () => navigate('/reset')

    return (
        <>
        <UqHeader msg="Welcome to Uqbar" openConnect={openConnect}/>
        <div>
            <button onClick={loginRedir}> Login </button>
            <button onClick={resetRedir}> Reset </button>
            <button onClick={inviteRedir}> Claim Uq Invite </button>
            <button onClick={registerRedir}> Register Uqname </button>
        </div>
        </>
    )
}

export default UqHome