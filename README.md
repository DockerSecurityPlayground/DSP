# DockerSecurityPlayground
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- ![alt text](https://raw.githubusercontent.com/giper45/DockerSecurityPlayground/master/public/assets/img/DSP_Example.png) -->

![](https://i.imgur.com/thNV8M7.png)


Docker Security Playground is an application that allows you to: 
- Create **network and network security scenarios**, in order to understand network protocols,  
rules, and security issues by installing DSP in your PC.  
- Learn **penetration testing techniques** by simulating vulnerability labs scenarios
-  **Manage a set of docker-compose project** . Main goal of DSP is to learn 
in penetration testing and network security, but its flexibility allows you the 
**creation**, **graphic editing** and **managment run / stop** of all your **docker-compose
labs**.  


## Installation
The suggested installation workflow for DSP is by using kali VM: 
* Install docker and docker-compose  
* Install latest stable nodejs
* Install dsp   


Here the steps to install DSP on a kali VM. Follow the similar steps for other Linux distributions, but be sure to install all the requirements.

1. Install DSP Requirements:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose nodejs npm git
``` 



> Note (kali keyring issue 2025).
> 
> If you have the following problem during the installation:
> ```
> Fetched 34.0 kB in 1s (58.4 kB/s)
> Warning: Failed to fetch http://http.kali.org/kali/dists/kali-rolling/InRelease  The following signatures couldn't be verified because the public key is not available: NO_PUBKEY ED65462EC8D5E4C5
> Warning: Some index files failed to download. They have been ignored, or old ones used instead.
> ```
> You need to add the missing key:
> ```
> wget https://http.kali.org/kali/pool/main/k/kali-archive-keyring/kali-archive-keyring_2025.1_all.deb
> sudo dpkg -i kali-archive-keyring_2025.1_all.deb
> rm kali-archive-keyring_2025.1_all.deb
> ```

2. Enable the docker start at boot and configure your current user to use docker without sudo:
```bash
sudo systemctl enable docker
sudo groupadd docker
sudo usermod -aG docker $USER
```
3. Log-out and log-in (it is required to let your current user to use docker withou sudo), and verify that you can use docker without sudo:
```bash
docker ps
```

Also, verify that docker compose is working:
```bash
docker compose --version # or docker-compose --version for older versions
```

Also verify the npm and nodejs installation:
```bash
node -v
npm -v
```

### Note for macOS M1 users 
It is possible to run DSP on host M1 by enabling Rosetta, but I strongly suggest to create a kali VM with UTM or Vmware fusion, follow the previous installation steps and install the binfmt-misc package in order to run x86 images on ARM architecture.

```
sudo apt install binfmt-support qemu-user-static
```

Restart the machine.

Then, use the Tonisiigi container to register all the interpreters for the different architectures: 
```
docker run --privileged --rm tonistiigi/binfmt --install amd64
```

Verify that docker images can run on your machine: 
```
docker run --rm -it --platform linux/amd64 ubuntu uname -m
```


4. Now you can install DSP: 
```bash
git clone https://github.com/DockerSecurityPlayground/DSP.git 
cd DSP 
npm install 
```

When the installation is completed, you can start DSP:
```
npm start
```

DSP will run on "http://localhost:18181"  . 
> Note for using Wireshark on kali: I suggest to use chromium browser, as the wireshark container uses some codec that are not supported by firefox on Kali.  You can start chromium by just tiping "chromium" in the terminal.




The first step will be to install all the required folders in the current machine. 

You can also automate this insstallation step by using the environment variable
``` 
export DSP_AUTOINSTALL=1  && npm start
``` 







## Run DSP in virtual machine - expose on 0.0.0.0 interface 

If you want to user your host browser , you can expose on 0.0.0.0 interface.  
If you want to expose on another interface, change DSP_IFACE environment variable:
```
export DSP_IFACE="0.0.0.0"
```
Now you can use dsp on Remote interface.  






## Clean DSP   
If something goes wrong, you can reset DSP to factory by using the following command:   
``` 
npm run uninstall  
```   
This will delete everything, and you can start DSP from the installation step. 


## Official Repository  
[DSP_Repo](https://github.com/NS-unina/DSP_Repo) contains official DSP labs. Contribute to DSP by creating new DSP Labs 

## How can I **share my labs with the world** ?
   
During the installation you can create a local environment that has not link with git, or you can associate a personal repository the the application. This is very useful if you want to share your work with other people.   
DSP Repository must have several requirements, so I have created a base DSP Repo Template that you can use to create your personal repository.   
So, the easiest way to share labs is the following:    

1. Fork the NS-Unina project: [https://github.com/NS-unina/DSP_Repo.git](https://github.com/NS-unina/DSP_Repo.git) 
2. During the installation set github directory param to your forked repository.     
3.  Now create your labs and share it!   

It is important that all images that you use should be available to other users, so:   
- You can publish on docker hub so other users can pull your images in order to use your labs.   
- You can prov[ide dockerfiles inside the .docker-images directory, so users can use build.sh to build your images and use your repo.

If you need a "private way" to share labs you should share the repository in other ways, at current time there is no support to share private repositories. 

In DSP you can manage multiple user repositories (Repositories tab)   
## DSP Features  
-  Graphic Editor of docker-compose  
-  Docker Image and Dockerfile Management  
-  GIT Integration  
-  DSP Repository with a set of network security scenarios  

### Any question ?  
If you have a problem you can use Issue section.   
   
## Tests   
To run a test:   
``` 
mocha test/<test-nodejs-file.js>   
```   
tests use helper.start() method to initialize the test environment:   
*  A test config is created   
* homedir directory is mocked, in this way it is possible to use internal dsp directory for tests.   

### Troubleshooting  

#### During DSP installation
If you have the following error during the installation:   
``` 
[2020-12-14T10:18:21.854Z]  INFO: DockerSecurityPlayground/1536 on vagrant: [DOCKER ACTIONS - DOWNLOAD IMAGE]
events.js:174
      throw er; // Unhandled 'error' event
      ^

Error: connect EACCES /var/run/docker.sock
    at PipeConnectWrap.afterConnect [as oncomplete] (net.js:1107:14)
Emitted 'error' event at:
    at Socket.socketErrorListener (_http_client.js:401:9)
    at Socket.emit (events.js:198:13)
    at emitErrorNT (internal/streams/destroy.js:91:8)
    at emitErrorAndCloseNT (internal/streams/destroy.js:59:3)
    at process._tickCallback (internal/process/next_tick.js:63:19)
```   

Verify 2 things:   
1. docker is installed   
2. current user is in `docker` group   

To test it:   
``` 
docker ps   
``` 
DO NOT USE SUDO if you are running DSP with normal user.   
If you have the following error:   
```  
vagrant@vagrant:~/git/DockerSecurityPlayground$ docker ps
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json: dial unix /var/run/docker.sock: connect: permission denied
```   
You need to add your user to group docker:   
https://docs.docker.com/engine/install/linux-postinstall/  
```  
$ sudo groupadd docker
$ sudo usermod -aG docker $USER
```  
Log-out and log-in  
Now you need to clean DSP:   
```  
npm run uninstall  
```  
And now everything should work.  

### MacOS error


MacOS ECONNRESET error: 

```
events.js:183
      throw er; // Unhandled 'error' event
      ^

Error: read ECONNRESET
    at _errnoException (util.js:992:11)
    at TCP.onread (net.js:618:25)
```
On Mac it seems that there is some problem with some node package, so in order to solve this run:
```
MacBook-Pro:DockerSecurityPlayground gaetanoperrone$ npm install ws@3.3.2 --save-dev --save-exact
```
Other info here: [http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/wikis/docker-operation-errors](http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/wikis/docker-operation-errors)  


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`  
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request, we'll check 

## Any Questions? 
Use the **[Issues](http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/issues)**  in order to ask everything you want!. 




## Links
-  [![Arsenal](https://github.com/toolswatch/badges/blob/master/arsenal/usa/2018.svg)](https://www.toolswatch.org/2018/05/black-hat-arsenal-usa-2018-the-w0w-lineup/)  
- https://github.com/NS-unina/DSP_Repo.git  : Repository created for Network Security Course of Simon Pietro Romano in University of the Study in Naples, Federico II
## Contributors   


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/giper45"><img src="https://avatars2.githubusercontent.com/u/18548727?v=4?s=100" width="100px;" alt=""/><br /><sub><b>gx1</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/issues?q=author%3Agiper45" title="Bug reports">🐛</a> <a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=giper45" title="Code">💻</a> <a href="#content-giper45" title="Content">🖋</a> <a href="#design-giper45" title="Design">🎨</a> <a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=giper45" title="Documentation">📖</a> <a href="#maintenance-giper45" title="Maintenance">🚧</a> <a href="#projectManagement-giper45" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/spromano"><img src="https://avatars1.githubusercontent.com/u/4959718?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Simon Pietro Romano</b></sub></a><br /><a href="#design-spromano" title="Design">🎨</a> <a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=spromano" title="Documentation">📖</a> <a href="#projectManagement-spromano" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/catuhub"><img src="https://avatars0.githubusercontent.com/u/27270820?v=4?s=100" width="100px;" alt=""/><br /><sub><b>catuhub</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/issues?q=author%3Acatuhub" title="Bug reports">🐛</a> <a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=catuhub" title="Code">💻</a> <a href="#design-catuhub" title="Design">🎨</a> <a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=catuhub" title="Documentation">📖</a> <a href="#maintenance-catuhub" title="Maintenance">🚧</a> <a href="#projectManagement-catuhub" title="Project Management">📆</a></td>
    <td align="center"><a href="https://lotar.altervista.org"><img src="https://avatars0.githubusercontent.com/u/1824717?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giuseppe Di Terlizzi</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=giterlizzi" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ale753"><img src="https://avatars0.githubusercontent.com/u/33957205?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alessandro</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=ale753" title="Documentation">📖</a> <a href="#video-ale753" title="Videos">📹</a> <a href="#content-ale753" title="Content">🖋</a></td>
    <td align="center"><a href="https://github.com/RobertoD91"><img src="https://avatars2.githubusercontent.com/u/298514?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Roberto</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=RobertoD91" title="Code">💻</a> <a href="#content-RobertoD91" title="Content">🖋</a> <a href="#infra-RobertoD91" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/the-licato"><img src="https://avatars2.githubusercontent.com/u/20096272?v=4?s=100" width="100px;" alt=""/><br /><sub><b>the-licato</b></sub></a><br /><a href="#infra-the-licato" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jiin995"><img src="https://avatars3.githubusercontent.com/u/6164845?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gabriele Previtera</b></sub></a><br /><a href="https://github.com/giper45/DockerSecurityPlayground/commits?author=jiin995" title="Code">💻</a> <a href="#talk-jiin995" title="Talks">📢</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Thanks to **Giuseppe Criscuolo** and **Alessandro Placido Luise** for the logo design
## Changelog   
Got to [CHANGELOG.md](CHANGELOG.md) to see al the version changes.   

## Cite this work
If you use Docker Security Playground for your research activity, cite the following paper published by the IEEE (Institute of Electrical and Electronics Engineers) 
https://ieeexplore.ieee.org/document/8169747
``` 
@INPROCEEDINGS{8169747,
  author={Perrone, G. and Romano, S. P.},
  booktitle={2017 Principles, Systems and Applications of IP Telecommunications (IPTComm)}, 
  title={The Docker Security Playground: A hands-on approach to the study of network security}, 
  year={2017},
  volume={},
  number={},
  pages={1-8},
  keywords={Security;Communication networks;Tools;Containers;Virtualization;Standards},
  doi={10.1109/IPTCOMM.2017.8169747}}
```


## License
This project is under the **MIT license**
