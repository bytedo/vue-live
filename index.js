#!/bin/env node

/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2022/09/28 15:12:45
 */

import { join } from 'path'
import { createServer, compile } from './lib/index.js'

const WORK_SPACE = process.env.INIT_CWD

const CONFIG_FILE = join(WORK_SPACE, 'vue.live.js')

let args = process.argv.slice(2)

switch (args[0]) {
  case 'dev':
    import(CONFIG_FILE)
      .then(function (conf) {
        // console.log(conf)
        createServer(WORK_SPACE, conf.default)
      })
      .catch(err => {
        console.log('Import Error:', err)
      })
    break

  case 'build':
    import(CONFIG_FILE)
      .then(function (conf) {
        // console.log(conf)
        compile(WORK_SPACE, conf.default)
      })
      .catch(err => {
        console.log('Import Error:', err)
      })
    break
}
