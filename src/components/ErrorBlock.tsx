import { decode } from 'html-entities'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ErrorBlockProps {
  title: string
  message: string
  // children: ReactNode
}

const errorBlock = (props: ErrorBlockProps) => {
  const { title, message } = props

  return (
    <section className='error-block'>
      <h2 className='error-block__title'>{title}</h2>
      <p className='error-block__message'>{decode(message)}</p>
      <Link to='/' replace className='error-block__homelink'>
        Home으로 가기
      </Link>
    </section>
  )
}

export default errorBlock
