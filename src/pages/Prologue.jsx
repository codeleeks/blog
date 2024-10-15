import { useLoaderData } from 'react-router'
import AsyncBlock from '../components/AsyncBlock'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const PostCard = (props) => {
  const { post: fetched } = props
  const [post, setPost] = useState(fetched)

  useEffect(() => {
    fetched.fetchContents((fetchedPost) => {
      setPost((prev) => {
        return { ...prev, ...fetchedPost }
      })
    })
  }, [fetched])

  return (
    <Link to={`posts/${post.path}`}>
      <li className='posts-card' key={post.path}>
        <img
          className='posts-card__image'
          src={post.titleImage}
          alt='title image'
        />
        <h4 className='posts-card__title'>{post.title}</h4>
        <div className='posts-card__date'>
          <div className='posts-card__date__icon material-icons'>alarm</div>
          <p className='posts-card__date__text'>{post.date || ''}</p>
        </div>
        <p className='posts-card__summary'>{post.summary || ''}</p>
      </li>
    </Link>
  )
}

const Prologue = () => {
  const data = useLoaderData()

  return (
    <AsyncBlock resolve={data.posts}>
      {(fetched) => {
        const posts = fetched.map((p) => {
          return <PostCard key={p.path} post={p} />
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
