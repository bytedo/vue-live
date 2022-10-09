import http from 'http'
import fs from 'iofs'
import { join, resolve,dirname } from 'path'
import { parse } from 'url'

import { compileScss, parseJs, compileVue } from './compile-vue.js'

import MIME_TYPES from './mime-tpyes.js'
import { COMMON_HEADERS } from './constants.js'

const decode = decodeURIComponent

export default function createServer(root = '', conf = {}) {
  let pagesDir = ''
  let indexPage = Object.keys(conf.pages).map(it => {
    let tmp = it + '.html'
    return `<li><a href="/${tmp}">${tmp}</a></li>`
  }).join('')

  let currentPage = ''

  http
    .createServer(function (req, res) {
      let pathname = parse(req.url.slice(1)).pathname
      let isIndex = pathname === ''

      for (let k in COMMON_HEADERS) {
        res.setHeader(k, COMMON_HEADERS[k])
      }

      

      if (isIndex) {
        res.setHeader('content-type', MIME_TYPES.html)
        res.writeHead(200, 'OK')
        res.end('<ul>' + indexPage + '</ul>')
      } else {
        res.setHeader('accept-ranges', 'bytes')

        let tmp = pathname.split('.')
        let ext = tmp.pop()
        let page = tmp.join('.')

        let code = ''

        console.log(req);

        return res.end(JSON.stringify({url: req.url,ext, page}))

        switch (ext) {
          case 'html':
            {
              let entry = fs.cat(join(pagesDir, page, 'main.js')).toString()
              let fixedStyle = '\n\n'

              currentPage = page

              res.setHeader('content-type', MIME_TYPES.html)

              entry = entry
                .replace(/import (.*?) from (["'])(.*?)\2/g, function (m, alias, q, name) {
                  if (name.startsWith('@/')) {
                    name = name.replace('@/', '/aseets/js/')
                  }

                  if (!conf.imports[name]) {
                    if (name.startsWith('./')) {
                      name = name.replace('./', `/aseets/js/${currentPage}/`)
                    } else if (name.startsWith('/') && !name.startsWith('/aseets/js/')) {
                      name = name.replace(/^\//, '/aseets/js/')
                    }

                    if (!name.endsWith('.js') && !name.endsWith('.vue')) {
                      name += '.js'
                    }
                  }
                  return `import ${alias} from '${name}'`
                })
                .replace(/import (["'])(.*?)\1/g, function (m, q, name) {
                  if (name.endsWith('.css') || name.endsWith('.scss')) {
                    if (name.startsWith('@/')) {
                      name = name.replace('@/', '/aseets/css/')
                    }
                    let tmp = `style${Date.now()}`
                    fixedStyle += `document.adoptedStyleSheets.push(${tmp})\n`

                    return `import ${tmp} from '${name}' assert { type: 'css' }`
                  } else {
                    if (name.startsWith('@/')) {
                      name = name.replace('@/', '/aseets/js/')
                    }
                    // console.log(name, conf.imports[name])
                    if (!conf.imports[name]) {
                      if (!name.startsWith('/') && !name.startsWith('./')) {
                        name = '/' + name
                      }

                      if (!name.endsWith('.js') && !name.endsWith('.vue')) {
                        name += '.js'
                      }
                    }
                    return `import '${name}'`
                  }
                })

              entry += fixedStyle

              code = fs.cat('./index.html').toString()
              code = code
                .replace(
                  '</head>',
                  "<script>window.process = {env: {NODE_ENV: 'development'}}</script></head>"
                )
                .replace('{{importmap}}', JSON.stringify({ imports: conf.imports }))
                .replace(
                  '<script src="main.js"></script>',
                  `<script type="module">\n${entry}\n</script>`
                )
            }

            break

          case 'vue':
            {
              pathname = pathname.replace(/^aseets\/js\//, '')
              let file

              if (pathname.startsWith(currentPage)) {
                file = join(conf.pages, pathname)
              } else {
                file = join(root, pathname)
              }

              if (!fs.isfile(file)) {
                file = file.replace(/\.vue$/, '/index.vue')
              }

              // console.log('>>>>', file)
              code = compileVue(file)

              res.setHeader('content-type', MIME_TYPES.js)
            }
            break

          case 'scss':
          case 'css':
            {
              let file = join(root, pathname.replace(/^aseets\/css\//, ''))
              code = compileScss(file)
              res.setHeader('content-type', MIME_TYPES.css)
            }
            break

          case 'js':
            {
              pathname = pathname.replace(/^aseets\/js\//, '')
              let file
              if (pathname.startsWith(currentPage)) {
                file = join(conf.pages, pathname)
              } else {
                file = join(root, pathname)
              }
              if (fs.isfile(file)) {
                code = fs.cat(file)
              } else {
                file = file.replace(/\.js$/, '/index.js')
                code = fs.cat(file)
              }
              console.log(req.url, '>>>>', file)
              code = parseJs(code + '')
              res.setHeader('content-type', MIME_TYPES.js)
            }

            break

          default:
            res.setHeader('content-type', MIME_TYPES[ext] || MIME_TYPES.other)
            break
        }

        res.setHeader('content-length', Buffer.byteLength(code))
        res.writeHead(200, 'OK')
        res.end(code + '')
      }
    })
    .listen(conf.port)
    .on('error', err => {
      console.log(`${conf.port}端口被占用~~~`)
      conf.port++
      createServer()
    })
    .on('listening', _ => {
      console.log('启动成功, 请访问', 'http://127.0.0.1:' + conf.port)
    })
}
