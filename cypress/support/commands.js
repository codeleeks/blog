// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('visitPost', (childNumber, assertHandler) => {
  cy.visit('https://codeleeks.github.io/blog/')
  cy.get(`.prologue-posts > .posts > a:nth-child(${childNumber})`).as(`post-${childNumber}`).click().wait(4000)
  assertHandler()
  cy.go('back')
})

Cypress.Commands.add('visitAllPosts', (assertHandler) => {
  cy.visit('https://codeleeks.github.io/blog/')
  cy.get('.prologue-posts > .posts > a').each(($el, index, $list) => {
    cy.visitPost(index+1, assertHandler)
  })
})