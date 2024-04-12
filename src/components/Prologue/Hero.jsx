import { Link } from 'react-router-dom'
import Date from '../UI/Date'
import Section from '../UI/Section'
import LinkButton from '../UI/LinkButton'

export default (props) => {
  return (
    <Section>
      <figure className='hero'>
        <figcaption className='text'>
          <div>
            <Date dateTime='2022-06-22' />
            <h2>Tips and DIY inspiration for Creative Minds</h2>
          </div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cumque
            animi porro tempore reprehenderit officia eos aliquid sunt pariatur,
            dicta, odit vel, assumenda temporibus? Quas illum consequuntur
            voluptate nam at minus.
          </p>
          {/* TODO replace it with actual post link. */}

          <LinkButton to='/blog'>Read More</LinkButton>
        </figcaption>
        <img
          src='https://ojsfile.ohmynews.com/STD_IMG_FILE/2011/0625/IE001321369_STD.jpg'
          alt='example'
          className='image'
        />
      </figure>
    </Section>
  )
}
