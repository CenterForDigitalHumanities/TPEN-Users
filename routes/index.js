#!/usr/bin/env node

let express = require('express')
let router = express.Router()

const staticRouter = require('./static')
router.get('/',staticRouter)

const managementRouter = require('./manage-api')
router.use('/glossing-users/manage', managementRouter)

const glossingRouter = require('./glossing-users')
router.use('/glossing-users', glossingRouter)

module.exports = router
