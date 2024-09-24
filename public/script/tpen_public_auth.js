/**
 * @module AuthButton Adds custom element for login/logout of Auth0, based on configuration below.
 * @author cubap
 *
 * @description This module includes a custom `<button is="auth-button">` element for authentication within
 * the Dunbar Public Library and Archive Project.
 * Notes:
 * - Include this module and a button[is='auth-button'] element to use.
 * - Add the `disabled` property on any page that should be available to the public, but knowing the user may be helpful.
 * - This can be made more generic by passing in the constants and parameterizing {app:'tpen'}.
 */

import "./jwt.js"

const returnTo = origin

function authenticateInterfaces(returnTo) {
  const incomingToken = new URLSearchParams(window.location.search).get("idToken")
  const authenticatedElements = document.querySelectorAll('[requires-auth]')
  if(authenticatedElements.length === 0) {
    return
  }

  const userToken = incomingToken ?? localStorage.getItem("TPEN_USER").authentication
  
  // Redirect to login if no userToken
  if(!userToken) {
    location.href = `https://three.t-pen.org/login?returnTo=${returnTo ?? location.href}`
  }
  
  // Override the userToken if it is in the query string
  const TPEN_USER = !incomingToken ? localStorage.getItem("TPEN_USER") 
    : ()=> {
      const userData = jwtDecode(userToken)
      const user = {}
      user.authentication = userToken
      user.id = userData["http://store.rerum.io/agent"]?.split("/").pop()
      user.expires = userData.exp
      return user
    }
  authenticatedElements.forEach(el => {
    el.setAttribute("tpen-user", TPEN_USER.id)
    el.setAttribute("tpen-token-expires", TPEN_USER.expires)
    el.tpenAuthToken = userToken
  })
  localStorage.setItem("TPEN_USER", TPEN_USER)
}

const webAuth = new auth0.WebAuth({
  domain: DOMAIN,
  clientID: CLIENT_ID,
  audience: AUDIENCE,
  scope:
    "read:roles update:current_user_metadata name nickname picture email profile openid offline_access", 
  redirectUri: returnTo,   
  responseType: "id_token token",
  state: urlToBase64(location.href),
})

const logout = () => {
  localStorage.removeItem("userToken")
  delete window.TPEN_USER
  document
    .querySelectorAll('[is="auth-creator"]')
    .forEach((el) => el.connectedCallback())
  webAuth.logout({ returnTo }) 
}
const login = (custom) =>
  webAuth.authorize(Object.assign({ authParamsMap: { app: "tpen" } }, custom))

const getReferringPage = () => {
  try {
    return b64toUrl(location.hash.split("state=")[1].split("&")[0])
  } catch (err) {
    return false
  }
}

class TpenAuth extends HTMLElement {
  static get observedAttributes() {
    return ["tpen-user", "tpen-token-expires"]
  }

  constructor() {
    super()
    this.login = login
    this.logout = logout
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "tpen-user") {
      this.dispatchEvent(
        new CustomEvent("user-login", {
          detail: { user: newValue },
        })
      )
    }
    if (name === "tpen-token-expires") {
      this.expiring = setTimeout(() => {        
      this.dispatchEvent(
        new CustomEvent("token-expiration", {
          detail: { expires: newValue },
        })
      )
    }, newValue - Date.now())
  }

  connectedCallback() {
    const returnTo = this.getAttribute("returnTo")
    if (window.authenticating) {
      window.authenticating.then(() => {
        authenticateInterfaces(returnTo)
        delete window.authenticating
      })
    } else {
      window.authenticating = new Promise((resolve) => {
        authenticateInterfaces(returnTo)
        resolve()
      }).then(() => {
        delete window.authenticating
      })
    }

    this.addEventListener("user-login", () => {
      this.connectedCallback()
    })

    this.addEventListener("token-expiration", () => {
      this.addClass("authentication-expired")
  }    
}

customElements.define("tpen-auth", TpenAuth)

class AuthButton extends HTMLButtonElement {
  constructor() {
    super()
    this.onclick = logout
    this.login = login
    this.logout = logout
  }

  connectedCallback() {
    const returnTo = this.getAttribute("returnTo")
    if (window.authenticating) {
      window.authenticating.then(() => {
        authenticateInterfaces(returnTo)
        delete window.authenticating
      })
    } else {
      window.authenticating = new Promise((resolve) => {
        authenticateInterfaces(returnTo)
        resolve()
      }).then(() => {
        delete window.authenticating
      })
    }
  }
}

customElements.define("auth-button", AuthButton, { extends: "button" })

class AuthCreator extends HTMLInputElement {
  constructor() {
    super()
  }

  connectedCallback() {
    if (!window.TPEN_USER) {
      return
    }
    this.value = TPEN_USER["http://store.rerum.io/agent"] ?? "anonymous"
  }
}

customElements.define("auth-creator", AuthCreator, { extends: "input" })

/**
 * Follows the 'base64url' rules to decode a string.
 * @param {String} base64str from `state` parameter in the hash from Auth0
 * @returns referring URL
 */
function b64toUrl(base64str) {
  return window.atob(base64str.replace(/\-/g, "+").replace(/_/g, "/"))
}
/**
 * Follows the 'base64url' rules to encode a string.
 * @param {String} url from `window.location.href`
 * @returns encoded string to pass as `state` to Auth0
 */
function urlToBase64(url) {
  return window
    .btoa(url)
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/, "")
}

export default { AuthButton, AuthCreator }
