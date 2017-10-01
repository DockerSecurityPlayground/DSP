var Walker = require('walker') 

Walker('/Users/gaetanoperrone/dsp')
  .on('entry', function(entry, stat) {
    console.log('Got entry: ' + entry)
  })
  .on('dir', function(dir, stat) {
    console.log('Got directory: ' + dir)
  })
  .on('file', function(file, stat) {
    console.log('Got file: ' + file)
  })
  .on('symlink', function(symlink, stat) {
    console.log('Got symlink: ' + symlink)
  })
  .on('blockDevice', function(blockDevice, stat) {
    console.log('Got blockDevice: ' + blockDevice)
  })
  .on('fifo', function(fifo, stat) {
    console.log('Got fifo: ' + fifo)
  })
  .on('socket', function(socket, stat) {
    console.log('Got socket: ' + socket)
  })
  .on('characterDevice', function(characterDevice, stat) {
    console.log('Got characterDevice: ' + characterDevice)
  })
  .on('error', function(er, entry, stat) {
    console.log('Got error ' + er + ' on entry ' + entry)
  })
  .on('end', function() {
    console.log('All files traversed.')
  })
