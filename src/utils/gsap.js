import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)
export function scrollTo(target, config) {
  gsap.to(target, config)
}
