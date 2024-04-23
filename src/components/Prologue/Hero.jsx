export default (props) => {
  return (
    <figure>
      <ul className='canvas'>
        {[...Array(200)].map((_, i) => (
          <li key={i} className='star'></li>
        ))}
      </ul>
      <figcaption>
        <h2>KASONG LEE</h2>
        <blockquote>
          Be <span className='happy'>happy</span> <br />
          <span className='healthy'>healthy</span> <br />
          <span className='realistic'>realistic.</span>
        </blockquote>
      </figcaption>
    </figure>
  )
}
