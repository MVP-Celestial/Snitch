import CartTransition from '../features/cart/components/CartTransition'
import './App.css'
import { RouterProvider } from 'react-router'
import {routes} from './app.routes'
import {useSelector} from 'react-redux'
import {useAuth} from '../features/auth/hook/useAuth'
import { useEffect } from 'react'

function App() {
    const {handleGetMe} = useAuth()
   
     const user = useSelector((state) => state.auth.user)
     console.log(user)

     useEffect(() => {
        handleGetMe()
     },[])
      

     return <CartTransition router={routes}><RouterProvider router={routes} /></CartTransition> 
    }

export default App
// 

