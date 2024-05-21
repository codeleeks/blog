describe('template spec', () => {
  it('모든 포스트에서 post-page의 width가 post의 width랑 같아야 함', () => {
    cy.visitAllPosts(() => {
      cy.get('.post-page').invoke('outerWidth').as('post-wrapper-width')
      cy.get('.post-page .post')
        .invoke('outerWidth')
        .then((postWidth) => {
          cy.get('@post-wrapper-width').then((postWrapperWidth) => {
            expect(postWrapperWidth).to.equal(postWidth)
          })
        })
    })
  })
  it('모든 포스트에서 포스트 내용이 나와야 함.', () => {
    cy.visitAllPosts(() => {
      cy.get('.error').should('not.exist')
    })
  })
  it('포스트에서 메시지박스가 있을 때, 코드 width가 메시지박스의 width보다 작아야 함.', () => {
    cy.visitAllPosts(() => {
      cy.get('main').then(($main) => {
        if ($main.find('.message-box').length) {
          cy.get('.message-box').then(($mb) => {
            if ($mb.find('.message-box code').length) {
              cy.get('.message-box code')
                .invoke('outerWidth')
                .then((codeWidth) => {
                  cy.get('.message-box')
                    .invoke('outerWidth')
                    .then((mbWidth) => {
                      expect(codeWidth).to.be.lessThan(mbWidth)
                    })
                })
            }
          })
        }
      })
    })
  })
})
