#/bin/bash

# Update repository
sudo apt-get update
# Install NODE 
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
# Only for 14.04
# sudo apt-get install -y \
#  linux-image-extra-$(uname -r) \
#  linux-image-extra-virtual

# Allow https download
sudo apt-get install -y \
      apt-transport-https \
          ca-certificates \
              curl \
                  software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
# verify if fingerprint is 9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88.

sudo apt-key fingerprint 0EBFCD88
#Setup stable repository
sudo add-apt-repository \
     "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) \
           stable"

# Update the repo again
 sudo apt-get update
 # Finally install 
 sudo apt-get install -y docker-ce
 # Install docker-compose
 sudo apt-get install -y docker-compose

# Add docker to usermod in order to avoid the sudo commands
sudo usermod -aG docker $USER

# Install new version of FIREFOX
#wget https://ftp.mozilla.org/pub/firefox/releases/52.0/linux-x86_64/en-US/firefox-52.0.tar.bz2
#tar -xjf firefox-52.0.tar.bz2

# sudo restart Ubuntu
sudo reboot

