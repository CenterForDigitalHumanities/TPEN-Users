import assert from 'assert'
import { describe, it, beforeEach, mock } from 'node:test'
import { JSDOM } from 'jsdom'

// Mock global objects before importing the module that uses them
const dom = new JSDOM(`<!DOCTYPE html><html><head><script src="../tpen_public_auth.js"></script></head><body></body></html>`, { url: "http://localhost", runScripts: "dangerously" })
global.window = dom.window
global.document = dom.window.document
global.localStorage = dom.window.localStorage
global.history = dom.window.history
global.navigator = dom.window.navigator

describe("public_auth", () => {
    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = `
            <div requires-auth></div>
            <div requires-auth></div>
        `
        window.history.pushState({}, 'Test Title', '/')
    })

    it("should do nothing if no elements require auth", () => {
        document.body.innerHTML = ''
        assert.strictEqual(localStorage.getItem("TPEN_USER"), null)
    })

    it("should redirect to login if no userToken", () => {
        assert.match(window.location.href, /login/)
    })

    it("should use token from query string if available", (t) => {
        const token = "testToken"
        const userData = { "http://store.rerum.io/agent": "http://store.rerum.io/v1/id/123", exp: 2208988800 }
        t.mock.fn(global.jwtDecode,()=>userData)
        window.history.pushState({}, 'Test Title', `/?idToken=${token}`)
        const TPEN_USER = JSON.parse(localStorage.getItem("TPEN_USER"))
        assert.strictEqual(TPEN_USER.authentication, token)
        assert.strictEqual(TPEN_USER.id, "123")
        assert.strictEqual(TPEN_USER.expires, 2208988800)
    })

    it("should use token from localStorage if no query string token", (t) => {
        const token = "localStorageToken"
        const userData = { "http://store.rerum.io/agent": "http://store.rerum.io/v1/id/456", exp: 2208988900 }
        t.mock.fn(global.jwtDecode,()=>userData)
        localStorage.setItem("TPEN_USER", JSON.stringify({ authentication: token }))
        const TPEN_USER = JSON.parse(localStorage.getItem("TPEN_USER"))
        assert.strictEqual(TPEN_USER.authentication, token)
        assert.strictEqual(TPEN_USER.id, "456")
        assert.strictEqual(TPEN_USER.expires, 2208988900)
    })

    it("should set attributes on authenticated elements", (t) => {
        const token = "testToken"
        const userData = { "http://store.rerum.io/agent": "http://store.rerum.io/agent/789", exp: 2208989000 }
        t.mock.fn(global.jwtDecode,()=>userData)
        window.history.pushState({}, 'Test Title', `/?idToken=${token}`)
        const authenticatedElements = document.querySelectorAll('[requires-auth]')
        authenticatedElements.forEach(el => {
            assert.strictEqual(el.getAttribute("tpen-user"), "789")
            assert.strictEqual(el.getAttribute("tpen-token-expires"), "2208989000")
            assert.strictEqual(el.tpenAuthToken, token)
        })
    })

    // Additional tests
    it("should clear localStorage if token is expired", (t) => {
        const token = "expiredToken"
        const userData = { "http://store.rerum.io/agent": "http://store.rerum.io/v1/id/999", exp: Date.now() / 1000 - 10 }
        t.mock.fn(global.jwtDecode,()=>userData)
        localStorage.setItem("TPEN_USER", JSON.stringify({ authentication: token }))
        assert.strictEqual(localStorage.getItem("TPEN_USER"), null)
    })

    it("should not set attributes if token is invalid", (t) => {
        const token = "invalidToken"
        t.mock.fn(global.jwtDecode,()=>{ throw new Error("Invalid token")})
        window.history.pushState({}, 'Test Title', `/?idToken=${token}`)
        const authenticatedElements = document.querySelectorAll('[requires-auth]')
        authenticatedElements.forEach(el => {
            assert.strictEqual(el.getAttribute("tpen-user"), null)
            assert.strictEqual(el.getAttribute("tpen-token-expires"), null)
            assert.strictEqual(el.tpenAuthToken, undefined)
        })
    })
})
