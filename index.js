#!/bin/env node

/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2022/09/28 15:12:45
 */

import fs from 'iofs'
import { join } from 'path'

import createServer from './lib/dev.js'
import compile from './lib/prod.js'

const WORK_SPACE = process.env.PWD

const CONFIG_FILE = join(WORK_SPACE, 'vue.live.js')
const SOURCE_DIR = join(WORK_SPACE, 'src')

let args = process.argv.slice(2)

switch (args[0]) {
  case 'dev':
    import(CONFIG_FILE)
      .then(function (conf) {
        createServer(SOURCE_DIR, conf.default)
      })
      .catch(err => {
        console.log(err)
      })
    break

  case 'build':
    import(CONFIG_FILE)
      .then(function (conf) {
        let dist = conf.buildDir || 'dist'
        if (fs.isdir(dist)) {
          fs.rm(dist, true)
        }
        fs.mkdir(dist)
        compile(SOURCE_DIR, dist, conf.default)
      })
      .catch(err => {
        console.log(err)
      })
    break
}
