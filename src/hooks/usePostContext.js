import { createContext, useContext } from 'react'

export const postContext = createContext({
  isComplied: false,
  setIsCompiled: () => {},
})

export function usePostContext() {
  return useContext(postContext)
}
