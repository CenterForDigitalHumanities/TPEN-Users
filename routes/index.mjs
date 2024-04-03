#!/usr/bin/env node

import express from "express"

let router = express.Router()

import staticRouter from "./static.mjs"
router.get("/", staticRouter)

import managementRouter from "./manage-api.mjs"
router.use("/tpen-users/manage", managementRouter)

import tpenRouter from "./tpen-users.mjs"
router.use("/tpen-users", tpenRouter)

export default router
