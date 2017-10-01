const fs = require('fs');

if (fs.existsSync('./dsp.log')) fs.unlink('./dsp.log');
console.log('dsp.log deleted');

