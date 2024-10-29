declare module '*.png'
declare module '*.svg'
declare module '*.jpeg'
declare module '*.jpg'

type Article = {
  mode: string
  path: string
  sha: string
  size: number
  type: string
  url: string
  title: string
  category: string
  date?: string
  titleImage?: string
  summary?: string
  contentsWithoutHeader?: string
  fetchContents: (
    callback: (article: Article) => void,
    includeContents?: boolean
  ) => void
}
