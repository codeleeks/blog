import Date from './Date'

export default (props) => {
  const { title, contents } = props

  return (
    <article className='card'>
      <header>
        <h3>{title}</h3>
        <Date dateTime='2024-04-14'/>
      </header>
      <p>{contents} Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ut cupiditate iusto necessitatibus, adipisci facere, nobis minus fugiat, inventore tenetur neque voluptatum. Fuga, quaerat voluptates? Repudiandae asperiores voluptate nam blanditiis sunt.</p>
    </article>
  )
}
