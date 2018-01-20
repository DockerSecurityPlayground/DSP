const images = require('../app/data/docker-images')
images.getListImages((err, data) => {
  console.log("In function");
  if (err) {
    console.log("ERROR");
    console.log(err);
  }
  else {
    console.log(data);
  }


})
