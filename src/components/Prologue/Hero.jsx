import { SKILLS } from '../../data/skills'
import selfiImg from '../../assets/행복한나.jpg'
export default (props) => {
  return (
    <figure>
      <img src={selfiImg} alt='selfi' />
      <figcaption>
        <h1>
          KASONG <br />
          <span>LEE</span>
        </h1>
        <div className='brief'>
          <p>Samsung Electronics Software Engineer.</p>
          <div className='tags'>
            <span>#backend</span>
            <span>#frontend</span>
            <span>#cloud</span>
          </div>
        </div>
        <ul className='skills'>
          {SKILLS.map((skill) => (
            <li key={skill.name}>
              <img src={skill.img} alt={skill.name} />
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
