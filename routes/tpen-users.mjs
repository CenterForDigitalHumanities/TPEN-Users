#!/usr/bin/env node

import express from "express"
import path from "path"
const router = express.Router()
import managementRouter from "./manage-api.mjs"

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// public also available at `/tpen-users` now
router.use(express.static(path.join(__dirname, "../public")))

//The /tpen-users/manage endpoint stuff
router.use("/manage", managementRouter)

/* GET home page.  Redirect to login */
router.get("/", function (req, res, next) {
  res.redirect(301, "profile.html")
})

export default router
