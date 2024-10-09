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

import "https://cdn.auth0.com/js/auth0/9.19.0/auth0.min.js"

const AUDIENCE = "https://cubap.auth0.com/api/v2/"
const ISSUER_BASE_URL = "cubap.auth0.com"
const CLIENT_ID = "bBugFMWHUo1OhnSZMpYUXxi3Y1UJI7Kl"
const DOMAIN = "cubap.auth0.com"
// const PROFILE_SERVICE = "https://dev.api.t-pen.org/my/profile/"
const PROFILE_SERVICE = "https://localhost:3009/my/profile/"

const returnTo = origin

const webAuth = new auth0.WebAuth({
  domain: DOMAIN,
  clientID: CLIENT_ID,
  audience: AUDIENCE,
  scope:
    "read:roles read:current_user_metadata openid offline_access", 
  redirectUri: returnTo,   
  responseType: "id_token",
  state: urlToBase64(location.href),
})

const logout = () => {
  localStorage.removeItem("userToken")
  delete window.TPEN_USER
  document
    .querySelectorAll('[is="auth-creator"]')
    ?.forEach((el) => el.connectedCallback())
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

class AuthButton extends HTMLButtonElement {
  constructor() {
    super()
    this.onclick = logout
    this.login = login
    this.logout = logout
  }

  connectedCallback() {
    webAuth.checkSession({}, (err, result) => {
      if (err) {
        if (this.getAttribute("disabled") !== null) {
          return
        }
        login()
      }
      const ref = getReferringPage()
      if (ref && ref !== location.href) {
        location.href = ref
      }
      localStorage.setItem("userToken", result.idToken)
      const USER = userFromPayload(result.idTokenPayload)
      // strictly, this is authentication, but the name matches the expected header
      USER.authorization = result.idToken 
      document
        .querySelectorAll('[is="auth-creator"]')
        ?.forEach((el) => el.connectedCallback())
      fetch(PROFILE_SERVICE, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.idToken}`,
        },
      })
        .then((res) => res.json())
        .then((profile) => {
          delete profile._id
          delete profile.type
          window.TPEN_USER = Object.assign(USER, profile)
          this.innerText = `Logout ${window.TPEN_USER.profile.displayName}`
          this.removeAttribute("disabled")
          const loginEvent = new CustomEvent("tpen-authenticated", {
            detail: window.TPEN_USER,
          })
          this.dispatchEvent(loginEvent)
        })
    })
  }
}

function userFromPayload(payload) {
  return {
    id: payload["http://store.rerum.io/agent"]?.split("/").pop(),
    isApproved: payload["http://rerum.io/app_flag"].includes("tpen"),
    roles: payload["http://rerum.io/user_roles"]?.roles?.filter(r=>r.startsWith("tpen")),
    subject: payload.sub,
    issued: payload.iat,
    expires: payload.exp,
    agent: payload["http://store.rerum.io/agent"],
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
