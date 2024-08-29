const CodeText = props => {
  const {text} = props

  let ret = text
  const matched = text.match(/`.+`/)
  if (matched) {
    const str = matched.input.substring(matched.index)
    ret = (
      <code className='hljs language-plaintext'>{str.replaceAll('`', '')}</code>
    )
  }

  return (
    <p>
      {ret}
    </p>
  )
}

export default CodeText