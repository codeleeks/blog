export let io = null
let globalTableOfContents = null
export function updateObserver(tableOfContents) {
  const postPageEl = document.querySelector('.post-page')
  const headingItemEls = Array.from(postPageEl.querySelectorAll('aside ul li'))
  // console.log(document.querySelector('.post-page aside ul li'))
  // console.log(headingItemEls)
  const slugToAnchor = headingItemEls.reduce((acc, el) => {
    const slug = el.querySelector('a').getAttribute('href').slice(1)
    return { ...acc, [slug]: el }
  }, {})

  io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        slugToAnchor[entry.target.id].classList.add('visible')
      } else {
        slugToAnchor[entry.target.id].classList.remove('visible')
      }
    })
  })

  globalTableOfContents = tableOfContents
}

export function observes() {
  const contentsHeadingEls = document
    .querySelector('.post-page .post .contents')
    .querySelectorAll('h1,h2,h3,h4,h5,h6')
  contentsHeadingEls.forEach((el) => {
    if (
      el.textContent &&
      globalTableOfContents &&
      globalTableOfContents.some((heading) => heading.slug === el.id)
    ) {
      io.observe(el)
    }
  })
}

export function clear() {
  io.disconnect()
  io = null
  globalTableOfContents = null
}
