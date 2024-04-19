import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

export default (props) => {
  const { heading } = props
  const clickHandler = (e) => {
    e.preventDefault()

    const slug = e.target.attributes.href.value
    gsap.to(window, {
      duration: 1,
      scrollTo: {
        y: slug,
        offsetY: 10,
      },
    })
  }

  const content = (
    <li
      key={heading.slug}
      className={`heading-${heading.level}`}
      onClick={clickHandler}
    >
      <a href={`#${heading.slug}`}>{heading.text}</a>
    </li>
  )
  
  

  return <>{content}</>
}
