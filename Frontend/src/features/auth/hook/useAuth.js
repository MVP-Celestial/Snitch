import { setUser, setLoading } from "../state/auth.slice"
import {register,login} from "../service/auth.api"
import { useDispatch } from "react-redux"
import { getMe } from "../service/auth.api"

export const useAuth = () => {

    const dispatch = useDispatch()
 

async function handleRegister({email, contact,password,fullname, isSeller = false}) {
    
    const data = await register({email, contact, password, fullname,isSeller})

    dispatch(setUser(data.user))

}
  
    async function handleLogin({email, password}) {

    const data = await login({email,password})
    dispatch(setUser(data.user))
   
   }

   async function handleGetMe() {
    try{
        dispatch(setLoading(true))
        const data = await getMe() 
        dispatch(setUser(data.user))

    }catch(err) {
        console.log(err)

    }finally {
        dispatch(setLoading(false))

    }
   }



    return { handleRegister, handleLogin, handleGetMe }
}
