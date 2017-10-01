labs = require('../app/data/labels.js') 


labs.getLabels('/Users/gaetanoperrone/dsp/giper_repo/labels.json', function(err, obj) {
	console.log(err)
})
