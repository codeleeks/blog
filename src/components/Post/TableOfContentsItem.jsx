import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { useRef, useState } from 'react'

gsap.registerPlugin(ScrollToPlugin)
let headingSlug
export default (props) => {
  const { heading } = props
  const timer = useRef()

  const clickHandler = (e) => {
    e.preventDefault()

    const slug = e.target.attributes.href.value
    gsap.to(window, {
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
      console.log(headingSlug)
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
