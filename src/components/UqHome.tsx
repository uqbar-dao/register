import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

type UqHomeProps = {
    needKey: boolean,
    setNeedKey: React.Dispatch<React.SetStateAction<boolean>>,
}
  
function UqHome ({needKey, setNeedKey}: UqHomeProps) {

    useEffect(() => {
        (async () => {
        const response = await fetch('/has-keyfile', { method: 'GET'})
        setNeedKey(await response.json())
        })()
    },[])

    const navigate = useNavigate()
    const inviteRedir = () => navigate('/claim-invite')
    const registerRedir = () => navigate('/register-name')
    const loginRedir = () => navigate('/login')

    return (
        <div>
            <button onClick={loginRedir}> 
                { needKey ? "Upload Keyfile and Login" : "Login" }
            </button>
            <button onClick={inviteRedir} >Claim Uq Invite </button>
            <button onClick={registerRedir} >Register Uqname </button>
        </div>
    )
}

export default UqHome