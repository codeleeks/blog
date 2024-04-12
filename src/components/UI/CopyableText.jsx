import { createContext, useState } from 'react'

export default (props) => {
  const [isCopied, setIsCopied] = useState(false)
  const { href, address } = props

  async function handleCopy() {
    setIsCopied(true)
    try {
      await navigator.clipboard.writeText(address)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <a href={href}>{address}</a>
      <button onClick={handleCopy}>
        <span
          className={`material-symbols-outlined ${
            isCopied ? 'copied' : undefined
          }`}
        >
          {isCopied ? 'check' : 'content_copy'}
        </span>
      </button>
    </>
  )
}
