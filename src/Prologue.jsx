const Prologue = () => {
  return (
    <>
      <header className='header'></header>
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
          <li className='posts-card'>hello</li>
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
