# Installation 

This document document provides instructions for installing the software. Please follow the steps below to ensure a successful installation.


## MacOS
1. Download the Docker installer (select ARM version for Apple Silicon) from the [Docker website](https://docs.docker.com/desktop/setup/install/mac-install/).


2. Install xcode command line tools (open a Terminal and run `xcode-select --install`)
3. Clone the DSP repository:

```bash
git clone https://github.com/DockerSecurityPlayground/DSP
```


## Alternative with rosetta
1. Download UTM and install UTM Debian Rosetta

https://mirror.bouwhuis.network/utm/vms/debian-12-rosetta.html
2. Install Docker and DSP according to the instructions for Debian-based distributions (see below).





## Debian-based distributions
1. Install docker

```
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh --dry-run
```

2. Add your user to the docker group to run docker without sudo:

```bash
sudo usermod -aG docker $USER
```

3. Restart the vm or logout from the current session and log back in to apply the group changes.


4. Follow the instructions to install nodejs and npm:
https://nodejs.org/en/download


Installation check:
```
node -v
npm -v
``` 


5. Install build-essential package to compile native addons:

```bash
sudo apt-get update
sudo apt-get install build-essential
```




6. Clone the DSP repository and install dependencies:
```
https://github.com/DockerSecurityPlayground/DSP
cd DSP 
npm install
```


7. Start the DSP application:

```bash
npm start 
```





5. Navigate to the DSP directory:

```bash
cd DSP
```
5. Run `npm install` to install the required dependencies.
6. Start the DSP application:

```bash
npm start 
```













