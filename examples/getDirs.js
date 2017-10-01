const fs = require('fs')
const path = require('path')

function getDirectories (srcpath) {
  return fs.readdirSync(srcpath)
    .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
}


var arr = getDirectories('.')
console.log(arr)
