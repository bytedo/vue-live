import http from 'http'
import fs from 'iofs'
import { join, resolve, dirname } from 'path'
import { parse } from 'url'

import { compileScss, parseJs, compileVue, parseHtml } from './compile-vue.js'

import MIME_TYPES from './mime-tpyes.js'
import { COMMON_HEADERS } from './constants.js'

const noc = Buffer.from('')

export default function createServer(root = '', conf = {}) {
  const IS_MPA = Object.keys(conf.pages).length > 1
  let indexPage = Object.keys(conf.pages)
    .map(it => {
      let tmp = it + '.html'
      return `<li><a href="/${tmp}">${tmp}</a></li>`
    })
    .join('')

  let pagesDir = '',
    currentPage = ''

  http
    .createServer(function (req, res) {
      let pathname = parse(req.url.slice(1)).pathname
      let pageName = '',
        isIndex = false
      let ext

      if (pathname) {
        pathname = pathname.split('/')

        if (pathname[0].endsWith('.html')) {
          pageName = pathname.shift()

          let tmp = pageName.split('.')

          ext = tmp.pop()
          pageName = tmp.join('.')

          currentPage = pageName
          pagesDir = dirname(conf.pages[pageName].entry)
        } else {
          ext = pathname.at(-1).split('.').pop()
          pageName = currentPage
        }
        pathname = pathname.join('/')
      } else {
        isIndex = true
      }

      for (let k in COMMON_HEADERS) {
        res.setHeader(k, COMMON_HEADERS[k])
      }

      if (isIndex) {
        res.setHeader('content-type', MIME_TYPES.html)
        res.writeHead(200, 'OK')
        res.end('<ul>' + indexPage + '</ul>')
      } else {
        res.setHeader('accept-ranges', 'bytes')

        let code = ''

        // return res.end(JSON.stringify({url: req.url, ext, pageName}))

        res.setHeader('x-ext', ext)
        res.setHeader('x-page', pageName)

        switch (ext) {
          case 'html':
            {
              res.setHeader('content-type', MIME_TYPES.html)

              let page = conf.pages[pageName]
              let entry = fs.cat(page.entry).toString()
              let html = fs.cat(join(process.env.PWD, 'index.html')).toString()

              entry = parseJs(entry, conf.imports, { IS_MPA, currentPage })

              code = parseHtml(html, { page, imports: conf.imports, entry })
            }

            break

          case 'vue':
            {
              let rpath = pathname.replace(/^assets\/js\//, '')
              let file

              if (IS_MPA) {
                file = join(pagesDir, rpath)
              } else {
                file = join(root, rpath)
              }
              if (!fs.isfile(file)) {
                file = file.replace(/\.vue$/, '/index.vue')
              }

              // console.log('>>>>', file)
              code = compileVue(file, conf.imports, { IS_MPA, currentPage, root, pagesDir })
              res.setHeader('content-type', MIME_TYPES.js)
            }
            break

          case 'scss':
          case 'css':
            {
              let file = join(root, pathname.replace(/^assets\/css\//, ''))
              code = compileScss(file)
              res.setHeader('content-type', MIME_TYPES.css)
            }
            break

          case 'js':
            {
              pathname = pathname.replace(/^assets\/js\//, '')
              let file
              if (pathname.startsWith(currentPage)) {
                file = join(pagesDir, pathname)
              } else {
                file = join(root, pathname)
              }
              if (fs.isfile(file)) {
                code = fs.cat(file)
              } else {
                file = file.replace(/\.js$/, '/index.js')
                code = fs.cat(file)
              }
              code = parseJs(code + '', conf.imports, { IS_MPA, currentPage })
              res.setHeader('content-type', MIME_TYPES.js)
            }

            break

          case 'png':
          case 'jpg':
          case 'jpeg':
          case 'webp':
          case 'gif':
          case 'svg':
          case 'ico':
          case 'bmp':
            res.setHeader('content-type', MIME_TYPES[ext])
            code = fs.cat(join(root, pathname))
            if (code === null) {
              console.error(pathname, '文件不存在')
              res.writeHead(404, 'Not Found')
              res.end('')
              return
            }
            break

          default:
            res.setHeader('content-type', MIME_TYPES[ext] || MIME_TYPES.html)
            break
        }

        res.setHeader('content-length', Buffer.byteLength(code || noc))
        res.writeHead(200, 'OK')
        res.end(code || noc)
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
