export default props => {
  const {children, className = ''} = props
  return <section className={`section ${className}`}>
    {children}
  </section>
}