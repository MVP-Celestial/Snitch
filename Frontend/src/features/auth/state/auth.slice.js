import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",      //pocket
    initialState: {
        user:null,
        loading: false,
        error: null,
    },
    reducers: {  //tools to change whats inside the pocket
        setUser: (state,action) => {
            state.user = action.payload;
        },
        setLoading: (state,action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        }
    }
})

export const {setError, setLoading, setUser} = authSlice.actions
export default authSlice.reducer