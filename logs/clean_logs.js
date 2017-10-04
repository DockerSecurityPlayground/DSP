const fs = require('fs');

if (fs.existsSync('./dsp.log')) {
  fs.unlinkSync('./dsp.log');
  console.log('dsp.log deleted');
}
if (fs.existsSync('./err.log')) {
  fs.unlinkSync('./err.log');
  console.log('err.log deleted');
}
if (fs.existsSync('./forever.log')) {
  fs.unlinkSync('./forever.log');
  console.log('forever log deleted')
}
if (fs.existsSync('./out.log')) {
  fs.unlinkSync('./out.log');
  console.log('out log deleted')
}

