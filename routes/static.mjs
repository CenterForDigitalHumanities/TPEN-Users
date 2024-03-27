#!/usr/bin/env node

/**
 * This module is used to define the routes of static resources available in `/public`
 * but also under `/tpen-users` paths.
 *
 * @author cubap
 */
import express from "express"
const router = express.Router()
import path from "path"
import { __dirname } from "../utilities/getDirectoryName.mjs"
 

// public also available at `/tpen-users`
router.use(express.static(path.join(__dirname, "../public")))

// Set default API response
router.get("/", function (req, res) {
  res.redirect("index.html")
})

// Export API routes
export default router
