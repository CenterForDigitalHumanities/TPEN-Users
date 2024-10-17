#!/usr/bin/env node
const auth = document.querySelector('[is="auth-button"]')

import capitalizeName from "../utils/capitalize.js"
import jwt_decode from "/script/jwt.js"
// const AUDIENCE = "https://cubap.auth0.com/api/v2/"
// const CLIENTID = "z1DuwzGPYKmF7POW9LiAipO5MvKSDERM"
// const TPEN_REDIRECT = origin + "/manage.html"
// const DOMAIN = "cubap.auth0.com"
const TPEN_USER_ROLES_CLAIM = "http://rerum.io/user_roles"

// /**
//  * Solely for getting the user profile.
//  */
// let authenticator = new auth0.Authentication({
//     "domain": DOMAIN,
//     "clientID": CLIENTID,
//     "scope": "read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
// })

auth.addEventListener("tpen-authenticated", (ev) => {
  const ref = getReferringPage()
  if (ref && ref.startsWith(location.href)) {
    stopHeartbeat()
    location.href = ref
  }
  if (window.username) {
    username.innerHTML = ev.detail.name ?? ev.detail.nickname ?? ev.detail.email
  }
  if (location.pathname.includes("profile.html")) {
    window.userForm?.addEventListener("submit", updateUserInfo)
    //Populate know information into the form inputs.
    for (let prop in ev.detail) {
      try {
        document
          .querySelector(`input[name='${prop}']`)
          ?.setAttribute("value", ev.detail[prop])
        document
          .querySelector(`[data-${prop}]`)
          ?.setAttribute(`data-${prop}`, ev.detail[prop])
      } catch (err) { }
    }
    document.querySelector(
      `[data-picture]`
    ).innerHTML = `<img src="${ev.detail.picture}"/>`
  }
  if (document.querySelector("[data-user='admin']")) {
    adminOnly(ev.detail.authorization)
  }
})

const ROLES = ["inactive", "public"]

async function adminOnly(token = window.TPEN_USER?.authorization) {
  let userRoles = TPEN_USER["http://rerum.io/user_roles"]?.roles
  //You can trust the token.  However, it may have expired.
  //A token was in localStorage, so there was a login during this window session.
  //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
  try {
    if (!isAdmin(token)) {
      showUserProfile(userRoles)
      return
    }
    const user_arr = await getAllUsers()

    const elem = user_arr.map(user => `
      <li user="${user.name}">
        <p>${user.name}</p>
        <img src="${user.picture}">
        <span class="role badge" userid="${user.user_id}">${user?.roles?.join(", ")}</span>
        <select class="select-role" name="${user.user_id}">
      ${ROLES.map(role => `
        <option ${user.roles.includes(role) ? "selected=true" : ""} value="${role}">${role}</option>
      `).join("")}
        </select>
      </li>
          `).join("")
    listHeading.innerText = 'TPEN3 User List'
    userList.innerHTML = elem
    userList.querySelectorAll("select").forEach((el) => {
      el.addEventListener("input", (event) =>
        assignRole(event.target.name, event.target.value)
      )
    })
  } catch (_err) {
    alert("not admin. boop.")
  }
  history.replaceState(null, null, " ")
}

function showUserProfile(userRoles) {
  listHeading.innerHTML = `<h4>User Profile</h4>`
  userList.innerHTML = `
           <div>
            <div>
            <h5>${TPEN_USER.nickname ?? TPEN_USER.name}  </h5>
            <small>${TPEN_USER.email}</small>

            </div>
             <img src="${TPEN_USER.picture}">
            <p>(${userRoles
      .map((role) => role.includes("tpen") ? capitalizeName(role) : null
      )
      .filter((role) => role)
      .join(", ")})</p>

           </div>
            `
}

async function assignRole(userid, role) {
  let url = `/tpen-users/manage/assignRole`
  const roleTag = document.querySelector(`.role[userid="${userid}"]`)

  fetch(url, {
    method: "POST",
    cache: "default",
    headers: {
      Authorization: `Bearer ${window.TPEN_USER?.authorization}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({ role, userid })
  })
    .then((_resp) => {
      if (!_resp.ok) throw _resp
      let prevRoles = roleTag.innerHTML.split(/\s+/)
      let filteredRoles = prevRoles.filter(
        (role) => role !== (role === "public" ? "public" : "inactive")
      )
      filteredRoles.push(role)

      roleTag.innerHTML = filteredRoles.join(" ")
      roleTag.classList.add("badge-success")
      roleTag.classList.remove("badge-danger")
    })
    .catch((err) => {
      console.log(err)
      roleTag.innerHTML += `⚠`
      roleTag.classList.remove("badge-success")
      roleTag.classList.add("badge-danger")
    })
}

// /**
//  * PUT to the tpen-users back end.
//  * You must supply your login token in the Authorization header.
//  * The body needs to be a user object, and you need to supply the user id in the body.
//  * You can only update the user info belonging to the user encoded on the token in the Authorization header
//  * This means you can only do this to update "your own" profile information.
//  */
// async function updateUserInfo(event, userid=window.TPEN_USER?.sub) {
//     event.preventDefault()
//     let info = new FormData(event.target)
//     let data = Object.fromEntries(info.entries())
//     for (let prop in data) {
//         if (data[prop] === "" || data[prop] === null || data[prop] === undefined) {
//             delete data[prop]
//         }
//     }
//     data.user_id = userid
//         let updatedUser = await fetch("/tpen-users/manage/updateProfileInfo", {
//             method: 'PUT',
//             cache: 'default',
//             headers: {
//                 'Authorization': `Bearer ${window.TPEN_USER?.authorization}`,
//                 'Content-Type': "application/json; charset=utf-8"
//             },
//             body: JSON.stringify(data)
//         })
//             .then(r => r.json())
//             .catch(err => {
//                 console.error("User Not Updated")
//                 console.error(err)
//                 return {}
//             })
//         if (updatedUser.user_id) {
//             alert("User Info Updated!")
//         }
//         else {
//             alert("User Info Update Failed!")
//         }
// }

// /**
//  * Auth0 redirects here with a bunch of info in hash variables.
//  * This function allows you pull a single variable from the hash
//  */
// function getURLHash(variable, urlString = document.location.href) {
//     const url = new URL(urlString)
//     var vars = new URLSearchParams(url.hash.substring(1))
//     return vars.get(variable) ?? false
// }

/**
 * Use our Auth0 Server back end to ask for all the Dunbap Apps users.
 */
async function getAllUsers() {
  return fetch("/tpen-users/manage/getAllUsers", {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${window.TPEN_USER?.authorization}`
    }
  })
    .then((resp) => {
      if (!resp.ok) throw resp
      return resp.json()
    })
    .catch(async (err) => {
      console.error(err.status)
      return []
    })
}

function isAdmin(token) {
  const user = jwt_decode(token)
  return userHasRole(user, "tpen_user_admin")
}
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

function getReferringPage() {
  try {
    return b64toUrl(location.hash.split("state=")[1].split("&")[0])
  } catch (err) {
    return false
  }
}

/**
 * Checks array of stored roles for any of the roles provided.
 * @param {Array} roles Strings of roles to check.
 * @returns Boolean user has one of these roles.
 */
function userHasRole(user, roles) {
  if (!Array.isArray(roles)) {
    roles = [roles]
  }
  return Boolean(
    user?.[TPEN_USER_ROLES_CLAIM]?.roles.filter((r) => roles.includes(r)).length
  )
}
