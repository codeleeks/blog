import { useLoaderData } from 'react-router'
import AsyncBlock from './components/AsyncBlock'
import PostCard from './components/PostCard'

const Prologue = () => {
  const data = useLoaderData()

  return (
    <AsyncBlock resolve={data.posts}>
      {(fetched) => {
        const posts = fetched.map((p) => {
          return (
            <PostCard key={p.path} post={p}/>
          )
        })

        return (
          <>
            <figure className='hero'>
              <img
                className='hero-img'
                src='https://codeleeks.github.io/blog/assets/%ED%96%89%EB%B3%B5%ED%95%9C%EB%82%98--1EVvs8x.jpg'
              />
              <figcaption className='hero-caption'>
                <div className='hero-caption__title'>
                  <h1 className='hero-caption__title-text'>
                    Kasong <br />
                    <span>Lee</span>
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
            <ul className='posts'>{posts}</ul>
          </>
        )
      }}
    </AsyncBlock>
  )
}

export default Prologue
