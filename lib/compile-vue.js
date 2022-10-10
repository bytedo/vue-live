/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2022/09/06 14:43:01
 */

import fs from 'iofs'
import scss from '@bytedo/sass'

import { JS_EXP, STYLE_EXP, HTML_EXP } from './constants.js'

const OPTIONS = {
  indentType: 'space',
  indentWidth: 2
}

let imports = {}

/**
 * 编译scss为css
 * @param file <String> 文件路径或scss代码
 * @param style <String> 代码风格, expanded | compressed
 */
export function compileScss(file, style = 'expanded') {
  try {
    if (fs.isfile(file)) {
      return scss.compile(file, { style, ...OPTIONS }).css
    } else {
      return scss.compileString(file, { style, ...OPTIONS }).css
    }
  } catch (err) {
    console.error(err)
  }
}

/**
 * 解析js
 * 主要是处理js的依赖引用
 * @param code <String> js代码
 */
export function parseJs(code = '', { IS_MPA, currentPage, root, pagesDir } = {}) {
  let fixedStyle = '\n\n'

  return (
    code
      .replace(/import (.*?) from (["'])(.*?)\2/g, function (m, alias, q, name) {
        if (name.startsWith('@/')) {
          name = name.replace('@/', '/assets/js/')
        }

        if (!imports[name]) {
          if (name.startsWith('./')) {
            name = name.replace('./', '/assets/js/')
            if (IS_MPA) {
              name += `${currentPage}/`
            }
          } else if (name.startsWith('/') && !name.startsWith('/assets/js/')) {
            name = name.replace(/^\//, '/assets/js/')
          }

          if (!name.endsWith('.js') && !name.endsWith('.vue')) {
            if (name.includes('components')) {
              name += '.vue'
            } else {
              name += '.js'
            }
          }
        }
        return `import ${alias} from '${name}'`
      })
      .replace(/import (["'])(.*?)\1/g, function (m, q, name) {
        if (name.endsWith('.css') || name.endsWith('.scss')) {
          if (name.startsWith('@/')) {
            name = name.replace('@/', '/assets/css/')
          }
          let tmp = `style${Date.now()}`
          fixedStyle += `document.adoptedStyleSheets.push(${tmp})\n`

          return `import ${tmp} from '${name}' assert { type: 'css' }`
        } else {
          if (name.startsWith('@/')) {
            name = name.replace('@/', '/assets/js/')
          }
          // console.log(name, imports[name])
          if (!imports[name]) {
            if (!name.startsWith('/') && !name.startsWith('./')) {
              name = '/' + name
            }

            if (!name.endsWith('.js') && !name.endsWith('.vue')) {
              name += '.js'
            }
          }
          return `import '${name}'`
        }
      }) + fixedStyle
  )
}

/**
 * 将vue转为js
 * @param file <String> 文件路径
 * @return <String> 返回转换后的js代码
 */
export function compileVue(file, conf, options = {}) {
  let code = (fs.cat(file) || '').toString()

  let js = code.match(JS_EXP)
  let scss = code.matchAll(STYLE_EXP)
  let html = code.match(HTML_EXP)

  let fixedStyle = '\n\n'

  imports = conf.imports

  // console.log(typeof scss)
  scss = [...scss].flatMap(it => (it ? it[1] : ''))
  js = js ? js[1] : ''
  html = (html ? html[1] : '').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  js = parseJs(js, options).replace(
    'export default {',
    `${fixedStyle}export default {\n  template: \`${html}\`,`
  )

  if (scss.length) {
    js += `  
  let stylesheet = new CSSStyleSheet()
  stylesheet.path = '${file.slice(options.IS_MPA ? options.pagesDir.length : options.root.length)}'
  stylesheet.replaceSync(\`${compileScss(scss.join('\n'))}\`)
  document.adoptedStyleSheets.push(stylesheet)
  `
  }

  return js
}
