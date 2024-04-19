import { Link } from 'react-router-dom'
import avatarImg from '../assets/avatar.png'
import codepenImg from '../assets/codepen.png'
import Icon from './UI/Icon'
export default (props) => {
  return (
    <header className='navigation'>
      <Link to={import.meta.env.BASE_URL}>
        <img src={avatarImg} alt='avatar of this blog' />
        <h1>Codeleeks</h1>
      </Link>
      <div className='icons'>
        <a href='https://github.com/codeleeks/blog' target='_blank'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            xmlnsXlink='http://www.w3.org/1999/xlink'
            width='34px'
            height='34px'
            viewBox='0 0 34 34'
            fill='#6f84d6'
            version='1.1'
            id='github'
          >
            <g id='surface1'>
              <path d='M 17 0 C 7.613281 0 0 7.613281 0 17 C 0 24.511719 4.871094 30.882812 11.625 33.132812 C 12.476562 33.289062 12.75 32.761719 12.75 32.3125 L 12.75 29.148438 C 8.019531 30.179688 7.035156 27.144531 7.035156 27.144531 C 6.261719 25.179688 5.148438 24.65625 5.148438 24.65625 C 3.605469 23.601562 5.265625 23.621094 5.265625 23.621094 C 6.972656 23.742188 7.871094 25.375 7.871094 25.375 C 9.386719 27.972656 11.847656 27.222656 12.816406 26.789062 C 12.96875 25.691406 13.410156 24.9375 13.898438 24.515625 C 10.121094 24.082031 6.152344 22.625 6.152344 16.113281 C 6.152344 14.257812 6.816406 12.738281 7.902344 11.550781 C 7.726562 11.121094 7.144531 9.390625 8.070312 7.050781 C 8.070312 7.050781 9.496094 6.59375 12.746094 8.792969 C 14.101562 8.417969 15.554688 8.226562 17 8.222656 C 18.445312 8.226562 19.898438 8.417969 21.257812 8.792969 C 24.503906 6.59375 25.929688 7.050781 25.929688 7.050781 C 26.855469 9.390625 26.273438 11.121094 26.097656 11.550781 C 27.1875 12.738281 27.847656 14.257812 27.847656 16.113281 C 27.847656 22.644531 23.871094 24.082031 20.085938 24.5 C 20.691406 25.027344 21.25 26.0625 21.25 27.648438 L 21.25 32.3125 C 21.25 32.765625 21.523438 33.296875 22.382812 33.128906 C 29.136719 30.878906 34 24.507812 34 17 C 34 7.613281 26.386719 0 17 0 Z M 17 0 ' />
            </g>
          </svg>
        </a>
        <a
          href='https://www.linkedin.com/in/kasong-lee-17533b149'
          target='_blank'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 34 34'
            id='linkedin'
            data-supported-dps='34x34'
            fill='#0a66c2'
            width='34'
            height='34'
            focusable='false'
            aria-busy='false'
          >
            <g>
              <path d='M34 2.5v29a2.5 2.5 0 01-2.5 2.5h-29A2.5 2.5 0 010 31.5v-29A2.5 2.5 0 012.5 0h29A2.5 2.5 0 0134 2.5zM10 13H5v16h5zm.45-5.5A2.88 2.88 0 007.5 4.6a2.9 2.9 0 100 5.8 2.88 2.88 0 002.95-2.9zM29 19.28c0-4.81-3.06-6.68-6.1-6.68a5.71 5.71 0 00-5.06 2.58h-.14V13H13v16h5v-8.51a3.32 3.32 0 013.23-3.59c1.59 0 2.77 1 2.77 3.52V29h5z'></path>
            </g>
          </svg>
        </a>
        <a href='https://codepen.io/kasong-lee' target='_blank' className='codepen'>
          <img src={codepenImg} alt='codepen icon' />
        </a>

        <Icon>search</Icon>
      </div>
    </header>
  )
}