#!/usr/bin/env node

const express = require('express')
const path = require('path')
const router = express.Router()
const managementRouter = require('./manage-api.js')
// public also available at `/glossing-users` now
router.use(express.static(path.join(__dirname, '../public')))

//The /glossing-users/manage endpoint stuff
router.use('/manage', managementRouter)

/* GET home page.  Redirect to login */
router.get('/', function(req, res, next) {
  res.redirect(301, 'profile.html')
})

module.exports = router
