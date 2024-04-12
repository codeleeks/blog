import { Link } from 'react-router-dom'
import Section from '../UI/Section'
import PostItem from './PostItem'
import LinkButton from '../UI/LinkButton'

const LATEST_POSTS = [
  {
    id: 'p1',
    title: 'Wild Photography Technology',
    image:
      'https://images.twinkl.co.uk/tw1n/image/private/t_630/u/ux/leopard-515509-1920_ver_1.jpg',
    date: '2023-01-23',
    url: '',
  },
  {
    id: 'p2',
    title: '별 헤는 밤',
    image:
      'https://ojsfile.ohmynews.com/STD_IMG_FILE/2011/0625/IE001321369_STD.jpg',
    date: '2023-01-24',
    url: '',
  },
  {
    id: 'p3',
    title: 'Wild Photography Technology',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6yTlyx5Ta1LSCSJZFI4ugGEyC2C_gfNapMHLJaOOkSQ&s',
    date: '2023-01-23',
    url: '',
  },
  {
    id: 'p4',
    title: '별 헤는 밤',
    image:
      'https://ojsfile.ohmynews.com/STD_IMG_FILE/2011/0625/IE001321369_STD.jpg',
    date: '2023-01-24',
    url: '',
  },
]

export default (props) => {
  const postItems = LATEST_POSTS.map((post) => (
    <li key={post.id}>
      <Link to={post.url}>
        <PostItem post={post} />
      </Link>
    </li>
  ))

  return (
    <Section className='light-gray'>
      <div className='latest-posts'>
        <div className='contents'>
          <h3 className='title'>Latest Posts</h3>
          <ul>{postItems}</ul>
        </div>
        <LinkButton to='posts' className='more-btn'>
          more posts
        </LinkButton>
      </div>
    </Section>
  )
}
