/**
 * {一些常量}
 * @author yutent<yutent.io@gmail.com>
 * @date 2022/09/06 11:54:56
 */

export const JS_EXP = /<script[^>]*?>([\w\W]*?)<\/script>/
export const STYLE_EXP = /<style[^>]*?>([\w\W]*?)<\/style>/g
export const HTML_EXP = /<template[^>]*?>([\w\W]*?)<\/template>/

export const CSS_SHEET_EXP = /([\w\.,#\-:>\+\~\|\(\)\[\]"'\=\s]+)\{([^\{\}]*?)\}/g

export const COMMON_HEADERS = {
  'Cache-Control': 'no-store'
}
