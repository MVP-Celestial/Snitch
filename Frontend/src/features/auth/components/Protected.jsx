import {useSelector} from "react-redux"
import { useNavigate } from "react-router-dom";

const Protected = ({children}) => {
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)
    const navigate = useNavigate()

    if(loading) {
        return <div>Loading...</div>
    }

    if(!user) {
      navigate("/login")
      
    }







  return (
    {children}
  )
}

export default Protected