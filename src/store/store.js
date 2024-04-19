import { configureStore } from '@reduxjs/toolkit'
import postReducer from './post-store.js'

export const store = configureStore({
  reducer: {
    post: postReducer,
  },
})
