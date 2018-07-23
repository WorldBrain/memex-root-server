import { expect } from 'chai'
import { normalizeUrlForLinkGeneration } from "./urls"

describe('URL utils', () => {
    describe('normalizeUrlForLinkGeneration()', () => {
        it('should handle trailing slashes correctly', () => {
            expect(normalizeUrlForLinkGeneration('https://bla.com/article')).to.equal('bla.com/article')
            expect(normalizeUrlForLinkGeneration('https://bla.com/article/')).to.equal('bla.com/article')
            expect(normalizeUrlForLinkGeneration('https://bla.com/article//')).to.equal('bla.com/article')
        })
        it('should handle trailing slashes correctly with query params', () => {
            expect(normalizeUrlForLinkGeneration('https://bla.com/article?foo=bar')).to.equal('bla.com/article')
            expect(normalizeUrlForLinkGeneration('https://bla.com/article/?foo=bar')).to.equal('bla.com/article')
            expect(normalizeUrlForLinkGeneration('https://bla.com/article//?foo=bar')).to.equal('bla.com/article')
        })
    })
})
