
import { NavLink } from 'react-router-dom'
import AvatarImg from './assets/avatar.png'

const Prologue = () => {
  return (
    <>
      <header className='header'>
        <div className='header-left'>
          <img
            className='header-left__avatar'
            src={AvatarImg}
            alt='avatar image'
          />
          <h1 className='header-left__title'>silverbullet</h1>
        </div>
        <div className='header-right'>
          <div className='header-right__menu-bg'></div>
          <div className='header-right__menu-toggler'>
            <div className='header-right__menu-toggler__icon material-icons'>
              menu
            </div>
          </div>
          <ul className='header-right__links'>
            <li className='header-right__links-posts'>
              <NavLink to=''>posts</NavLink>
            </li>
            <li className='header-right__links-snippets'>
              <NavLink to='snippets'>snippets</NavLink>
            </li>
          </ul>
        </div>
      </header>
      <main className='main'>
        <figure className='hero'>
          <img
            className='hero-img'
            src='https://codeleeks.github.io/blog/assets/%ED%96%89%EB%B3%B5%ED%95%9C%EB%82%98--1EVvs8x.jpg'
          />
          <figcaption className='hero-caption'>
            <div className='hero-caption__title'>
              <h1 className='hero-caption__title-text'>
                Kasong <br /> Lee
              </h1>
            </div>
            <div className='hero-caption__article'>
              <p className='hero-caption__description'>
                Samsung Electronics Software Engineer
                <br />
                #spring #react
              </p>
            </div>
          </figcaption>
        </figure>
        <ul className='posts'>
          <li className='posts-card'>
            <img
              className='posts-card__image'
              src='https://raw.githubusercontent.com/codeleeks/blog/codeleeks-images/database/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%20%EA%B2%A9%EB%A6%AC%20%EC%88%98%EC%A4%80/title.png'
              alt=''
            />
            <h4 className='posts-card__title'>ElasticSearch SSL 적용하기</h4>
            <div className='posts-card__date'>
              <div className='posts-card__date__icon material-icons'>alarm</div>
              <p className='posts-card__date__text'>Aug 5, 2024</p>
            </div>
            <p className='posts-card__summary'>
              Spring Data ElasticSearch에서 SSL를 적용합니다.
            </p>
          </li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
          <li className='posts-card'>hello</li>
        </ul>
      </main>
      <footer className='footer'>designed by codeleeks</footer>
    </>
  )
}

export default Prologue
