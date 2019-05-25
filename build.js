const glob = require('glob')
const fs = require('fs')
const rimraf = require('rimraf')
const HtmlMinifier = require('html-minifier')
const CleanCSS = require('clean-css')
const UglifyJS = require('uglify-js')

rimraf.sync('./dist')
fs.mkdirSync('dist')
let files = glob.sync('**/*', { nodir: true, cwd: 'src' })
files.forEach(e => minify(e))

function minify (file) {
  console.log(' * ' + file)
  let ext = file.match(/\.[^\.]+$/i) ? file.match(/\.[^\.]+$/i)[0] : ''
  let name = file.replace(ext, '')
  switch (ext) {
    case '.html':
      write(name + ext, minifyHTML(read(file)))
      break;
    case '.css':
      write(name + ext, minifyCSS(read(file)))
      break;
    case '.js':
      write(name + ext, minifyJS(read(file)))
      break;
    default:
      copy(file)
  }

  function minifyHTML (code) {
    return HtmlMinifier.minify(code, {
      removeComments: true,
      collapseWhitespace: true
    })
  }

  function minifyCSS (code) {
    return new CleanCSS({/* options */}).minify(code).styles
  }

  function minifyJS (code) {
    let result = UglifyJS.minify(code, {/* options */})
    if (result.error) console.log(result.error)
    return result.code
  }

  function read (file) {
    return fs.readFileSync('src/' + file, 'utf8')
  }

  function write (path, content) {
    let pathArr = path.split(/(\\|\/)/i)
    let temp = 'dist/'
    for (let n = 0; n < pathArr.length - 2; n++) {
      temp += pathArr[n] + '/'
      if (!fs.existsSync(temp)) {
        fs.mkdirSync(temp)
      }
    }
    fs.writeFileSync('dist/' + path, content, { encoding: 'utf8' })
  }

  function copy (file) {
    let pathArr = file.split(/(\\|\/)/i)
    let temp = 'dist/'
    for (let n = 0; n < pathArr.length - 2; n++) {
      temp += pathArr[n] + '/'
      if (!fs.existsSync(temp)) {
        fs.mkdirSync(temp)
      }
    }
    fs.copyFileSync('src/' + file, 'dist/' + file)
  }
}
