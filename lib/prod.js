import fs from 'iofs'
import { join, resolve, dirname, parse } from 'path'
import Es from 'esbuild'
import { compileScss, parseJs, compileVue, parseHtml } from './compile-vue.js'

const noc = Buffer.from('')

export default function compile(root = '', dist = '', conf = {}) {
  //
  const IS_MPA = Object.keys(conf.pages).length > 1
  let timeStart = Date.now()
  let html = fs.cat(join(process.env.PWD, 'index.html')).toString()

  let pagesDir = '',
    currentPage = ''

  if (IS_MPA) {
  } else {
    let page
    let list = fs.ls(root, true).map(it => ({
      name: it.slice(root.length + 1),
      path: it,
      ext: parse(it).ext
    }))

    currentPage = Object.keys(conf.pages)[0]
    page = conf.pages[currentPage]

    console.log('正在生成 %s ...', `${currentPage}.html`)

    for (let it of list) {
      if (fs.isdir(it.path)) {
        continue
      }
      // 入口文件, 特殊处理
      if (it.path === page.entry) {
        let entry = fs.cat(page.entry).toString()
        entry = parseJs(entry, conf.imports, { IS_MPA, currentPage }, true)

        let code = parseHtml(html, { page, imports: conf.imports, entry })

        fs.echo(code, join(dist, `${currentPage}.html`))
        continue
      }

      console.log('  解析 %s ...', it.name)

      switch (it.ext) {
        case '.vue':
          {
            let code = compileVue(
              it.path,
              conf.imports,
              { IS_MPA, currentPage, root, pagesDir },
              true
            )

            Es.transform(code, { minify: true }).then(r => {
              fs.echo(
                r.code,
                join(dist, `assets/js/${it.name.split('.').shift()}.js`)
              )
            })
          }
          break

        case '.js':
          {
            let code = fs.cat(it.path)

            code = parseJs(
              code + '',
              conf.imports,
              { IS_MPA, currentPage },
              true
            )
            Es.transform(code, { minify: true }).then(r => {
              fs.echo(r.code, join(dist, `assets/js/${it.name}`))
            })
          }
          break

        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.webp':
        case '.gif':
        case '.svg':
        case '.ico':
        case '.bmp':
          fs.cp(it.path, join(dist, it.name))
          break

        case 'scss':
        case 'css':
          {
            let code = compileScss(it.path)
            fs.echo(code, join(dist, it.name))
          }
          break

        default:
          fs.cp(it.path, join(dist, it.name))
          break
      }
    }
  }

  console.log('\n页面处理完成, 耗时 %ss\n', (Date.now() - timeStart) / 1000)
}
