import productModel from "../models/product.model.js";
import {uploadFile} from "../services/storage.service.js"


export async function createProduct(req, res) {
 
    const { title, description, price } = req.body;
    const seller = req.user;

    const images = await Promise.all(req.files.map(async (file) => {
        return await uploadFile(file.buffer, file.originalname)
    }))

    
     
}