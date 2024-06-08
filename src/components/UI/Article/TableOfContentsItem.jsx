import { useEffect, useRef, useState } from 'react'
import { scrollTo } from '../../../utils/gsap'

export default (props) => {
  const { heading } = props
  const timer = useRef()
  let headingSlug

  const clickHandler = (e) => {
    e.preventDefault()

    const slug = e.target.attributes.href.value
    scrollTo(window, {
      duration: 1,
      scrollTo: {
        y: slug,
        offsetY: 80,
      },
    })

    if (timer.current) {
      clearTimeout(timer.current)
    }

    if (headingSlug) {
      const headingEl = document.querySelector(headingSlug)
      headingEl.classList.remove('active')
    }

    headingSlug = slug

    const headingEl = document.querySelector(slug)
    headingEl.classList.add('active')

    timer.current = setTimeout(() => {
      headingEl.classList.remove('active')
    }, 3000)
  }

  return (
    <li key={heading.slug} className={`heading-${heading.level}`}>
      <a href={`#${heading.slug}`} onClick={clickHandler}>
        {heading.text}
      </a>
    </li>
  )
}
