import GithubSlugger from 'github-slugger'

export type TableOfContents = {
  level: number
  text: string
  slug: string
}

export class HeadingObserver {
  io: IntersectionObserver = null
  tableOfContents: TableOfContents[] = []

  tableOfContentsFromContents(contents: string) {
    const slugger = new GithubSlugger()
    const adjustLevels = (levels: number[]) => {
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

    const contentsWithoutCodes = contents.replace(/`{3}(.*?)`{3}/gs, '')

    const pattern = /(?<level>^#+)\s(?<text>.+)$/gm

    const headings = [...contentsWithoutCodes.matchAll(pattern)]

    const adjustedLevels = adjustLevels(
      headings.map((heading) => heading.groups.level.length)
    )

    return headings.map((heading, index) => ({
      level: adjustedLevels[index],
      text: heading.groups.text,
      slug: slugger.slug(heading.groups.text),
    }))
  }
  register(headingItemEls: HTMLElement[], contents: string) {
    const slugToAnchor: any = headingItemEls.reduce((acc, el) => {
      const slug = el.querySelector('a').getAttribute('href').slice(1)
      return { ...acc, [slug]: el }
    }, {})

    this.io = new IntersectionObserver((entries, _) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          //TODO
          slugToAnchor[entry.target.id].classList.add('selected')
        } else {
          slugToAnchor[entry.target.id].classList.remove('selected')
        }
      })
    })

    this.tableOfContents = this.tableOfContentsFromContents(contents)
  }
  start(contentsHeadingEls: HTMLHeadingElement[]) {
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
    this.io?.disconnect()
    this.io = null
    this.tableOfContents = []
  }
}

//TODO
export const postTocObserver = new HeadingObserver()
export const snippetTocObserver = new HeadingObserver()
