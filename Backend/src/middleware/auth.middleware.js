import jwt from 'jsonwebtoken'
import {config }from '../config/config.js'
import userModel from '../models/user.model.js'



//identifies if seller is requesting the service or not. If yes, then allow him to create a product. If not, then throw an error
export const authenticateSeller = async (req, res, next) =>{

    const token = req.cookies.token

    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }

    try{
        const decoded = jwt.verify(token, config.JWT_SECRET)

        const user = await userModel.findById(decoded.id)

        if(user.role !== 'seller'){
            return res.status(403).json({message: "Forbidden"})
        }

        req.user = user
        next()


    }catch(err){
        console.error(err)
        return res.status(401).json({message: "Unauthorized"})
    }

}

