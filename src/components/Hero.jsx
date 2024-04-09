import { Link } from 'react-router-dom'
import Date from './UI/Date'
import Section from './UI/Section'

export default (props) => {
  return (
    <Section className='hero'>
      <div className='text'>
        <Date dateTime='2022-06-22' />
        <h2>Tips and DIY inspiration for Creative Minds</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cumque animi
          porro tempore reprehenderit officia eos aliquid sunt pariatur, dicta,
          odit vel, assumenda temporibus? Quas illum consequuntur voluptate nam
          at minus.
        </p>
        {/* TODO replace it with actual post link. */}
        <Link to='/blog'>
          <button>Read More</button>
        </Link>
      </div>
      <img
        src='https://ojsfile.ohmynews.com/STD_IMG_FILE/2011/0625/IE001321369_STD.jpg'
        alt='example'
        className='image'
      />
    </Section>
  )
}
