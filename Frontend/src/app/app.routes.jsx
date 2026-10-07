import { createBrowserRouter } from "react-router";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import CreateProduct from "../features/products/pages/CreateProduct"
import Dashboard from "../features/products/pages/Dashboard"

export const routes = createBrowserRouter([

    {
        path: "/",
        element: <h1>Hello world</h1>,
    },
    {
        path: "/register",
        element: <Register/>
    },
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/seller",
        children: [
            {
              path: "/seller/create-product",
              element: <CreateProduct/>  
            },
            {
                path: "/seller/dashboard",
                element: <Dashboard/>
            }
        ]
    },
])
