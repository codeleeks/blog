import GithubSlugger from 'github-slugger'

class TocObserver {
  io = null
  tableOfContents = []

  tableOfContentsFromContents(contents) {
    const slugger = new GithubSlugger()
    const adjustLevels = (levels) => {
      let min = 6
      for (const level of levels) {
        if (level < min) {
          min = level
          if (min === 1) {
            break
          }
        }
      }

      return levels.map((level) => level - min + 1)
    }

    const pattern = /(?<level>^#+)\s(?<text>.+)$/gm

    const headings = [...contents.matchAll(pattern)]

    const adjustedLevels = adjustLevels(
      headings.map((heading) => heading.groups.level.length)
    )

    return headings.map((heading, index) => ({
      level: adjustedLevels[index],
      text: heading.groups.text,
      slug: slugger.slug(heading.groups.text),
    }))
  }
  register(headingItemEls, contents) {
    const slugToAnchor = headingItemEls.reduce((acc, el) => {
      const slug = el.querySelector('a').getAttribute('href').slice(1)
      return { ...acc, [slug]: el }
    }, {})

    this.io = new IntersectionObserver((entries, _) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          slugToAnchor[entry.target.id].classList.add('visible')
        } else {
          slugToAnchor[entry.target.id].classList.remove('visible')
        }
      })
    })

    this.tableOfContents = this.tableOfContentsFromContents(contents)
  }
  start(contentsHeadingEls) {
    contentsHeadingEls.forEach((el) => {
      if (
        el.textContent &&
        this.tableOfContents &&
        this.tableOfContents.some((heading) => heading.slug === el.id)
      ) {
        this.io.observe(el)
      }
    })
  }

  clear() {
    this.io.disconnect()
    this.io = null
    this.tableOfContents = []
  }
}

export const postTocObserver = new TocObserver()
export const snippetTocObserver = new TocObserver()