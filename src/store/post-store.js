import {createSlice} from '@reduxjs/toolkit'

const initialState = {io: {}}
export const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setIntersectionObserver: (state, action) => {
      state.io = action.payload
    }
  }
})

export const { setIntersectionObserver } = postSlice.actions
export default postSlice.reducer