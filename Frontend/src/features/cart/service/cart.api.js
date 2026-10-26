import axios from "axios";

const cartApiInstance = axios.create({
    baseURL: "/api/cart",
    withCredentials: true, // Include cookies in requests
})


export const addItem = async (productId, variantId) => {
    const response = await cartApiInstance.post(`/add/${productId}/${variantId}`);
    return response.data;
};

export const getCart = async (signal) => {
    const response = await cartApiInstance.get(`/`, { signal });
    return response.data;
}

export const incrementCartItemApi = async (productId, variantId) => {
    const response = await cartApiInstance.patch(`/quantity/increment/${productId}/${variantId}`);
    return response.data;
};
