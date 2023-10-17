import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function UqHome () {

    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const loginRedir = () => navigate('/login')

    return (
        <div>
            <button onClick={loginRedir}> Login </button>
            <button onClick={inviteRedir}> Claim Uq Invite </button>
            <button onClick={registerRedir}> Register Uqname </button>
        </div>
    )
}

export default UqHome