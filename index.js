#!/bin/env node

/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2022/09/28 15:12:45
 */

import { join } from 'path'

import createServer from './lib/dev.js'
import compile from './lib/prod.js'

const WORK_SPACE = process.env.INIT_CWD

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
        console.log('Import Error:', err)
      })
    break

  case 'build':
    import(CONFIG_FILE)
      .then(function (conf) {
        compile(SOURCE_DIR, conf.default)
      })
      .catch(err => {
        console.log('Import Error:', err)
      })
    break
}
