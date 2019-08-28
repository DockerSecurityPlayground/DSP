#!/bin/bash

DSP_PATH="/home/vagrant/DockerSecurityPlayground"
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get update && sudo apt-get install -y git build-essential nodejs
if [ ! -d "$DSP_PATH" ] ; then
    git clone "https://github.com/giper45/DockerSecurityPlayground.git" "$DSP_PATH"
fi
cd $DSP_PATH
git pull
npm install
# forever list
# sudo npm install -g forever
