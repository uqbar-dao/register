import { useNavigate } from "react-router-dom"

function UqHome () {

    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')

    return (
        <div>
            <button onClick={inviteRedir} >Claim Uq Invite </button>
            <button onClick={registerRedir} >Register Uqname </button>
        </div>
    )
}

export default UqHome