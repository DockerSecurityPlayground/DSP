#!/bin/bash

DSP_PATH="/home/vagrant/dsp/DockerSecurityPlayground"
mkdir /home/vagrant/dsp
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get update && sudo apt-get install -y git build-essential nodejs
if [ ! -d "$DSP_PATH" ] ; then
    git clone "https://github.com/giper45/DockerSecurityPlayground.git" "$DSP_PATH"
fi
cd $DSP_PATH
git pull
npm install
sudo npm install pm2@latest -g
pm2 start index.js
pm2 startup
pm2 save
echo "DSP is running! Go to http://localhost:8080 and enjoy!"
# forever list
# sudo npm install -g forever
