#!/usr/bin/env node

let express = require("express")
let router = express.Router()

const staticRouter = require("./static")
router.get("/", staticRouter)

const managementRouter = require("./manage-api")
router.use("/tpen-users/manage", managementRouter)

const tpenRouter = require("./tpen-users")
router.use("/tpen-users", tpenRouter)

module.exports = router
