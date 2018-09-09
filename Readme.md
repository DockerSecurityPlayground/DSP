# DockerSecurityPlayground
![alt text](https://raw.githubusercontent.com/giper45/DockerSecurityPlayground/master/public/assets/img/dsp_logo.png)



Docker Security Playground is an application that allows you to: 
- Create **network and network security scenarios**, in order to understand network protocols,  
rules, and security issues by installing DSP in your PC.  
- Learn **penetration testing techniques** by simulating vulnerability labs scenarios
-  **Manage a set of docker-compose project** . Main goal of DSP is to learn 
in penetration testing and network security, but its flexibility allows you the 
**creation**, **graphic editing** and **managment run / stop** of all your **docker-compose
labs**. For more information look at the [Labs Managment]() page. 

## Installation  and Guides
Go to [wiki] (http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/wikis/home)
to learn all about the application.

## Prerequisites
* Nodejs (v 7 or later)
* git
* docker
* docker-compose
* compiler tools (g++, c, c++)
 
## Error Debug


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

## Q&A  
How can I share my labs with the world ?   
During the installation you can create a local environment that has not link with git, or you can associate a personal repository the the application. This is very useful if you want to share your work with other people.   
DSP Repository must have several requirements, so I have created a base DSP Repo Template that you can use to create your personal repository.   
So, the easiest way to share labs is the following:   
- Fork the project DSP_Repo (https://github.com/giper45/DSP_Repo.git)   
-  During the installation set github directory param to your forked repository.   
- Now create your labs and share it! .   
It is important that all images that you use should be available to other users, so:   
- You can publish on docker hub and update the "pull.sh" script under .docker-image application  other users can pull your images in order to use your labs.   
- You can provide dockerfiles inside the .docker-images directory, so users can use build.sh to build your images and to use your repo   

If you need a "private way" to share labs you should share the repository in other ways, at current time there is no support to share private repositories. 

At current time you there is no support to have more repositories in your DSP environment, anyway you can add git repositories to DSP in this way   

- git clone the repository on main dsp directory. This is a manual way, so you will have to install all docker images. If the repo make has created a "pull.sh" script under the .docker-images you can use it to download images. 

- Switch your local repository .    

Next developments will allow to manage more repositories.  

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`  
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request, we'll check 

## Any Questions? 
Use the **[Issues](http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/issues)**  in order to ask everything you want!. 

## Update the application: 
When you update the application it is important to update the npm packages (The application uses mydockerjs, a npm docker API that I am developing during DSP development: https://www.npmjs.com/package/mydockerjs)  
```
npm run update
```

## Documentation   
For documentation about DSP usage go to Wiki page: 
http://gitlab.comics.unina.it/NS-Thesis/DockerSecurityPlayground_1/wikis/home  

It is a little outdated, I will update it as possible !  

## History
TODO: Write history    


## Links
- [![Arsenal](https://github.com/toolswatch/badges/blob/master/arsenal/usa/2018.svg)](https://www.toolswatch.org/2018/05/black-hat-arsenal-usa-2018-the-w0w-lineup/)  
- [DSP Vagrant Box used in Blackhat Session](https://app.vagrantup.com/giper45/boxes/dsp_blackhat)  
- [Blackhat scenario in Gitlab](https://gitlab.com/dsp_blackhat/dsp_blackhat_vagrant.git) 

## Contributors   


* **Technical support**: Gaetano Perrone, Francesco Caturano 
* **Documentation support** Gaetano Perrone, Francesco Caturano
* **Application design: Gaetano Perrone, Simon Pietro Romano**
* **Application development: Gaetano Perrone, Francesco Caturano**
* **Docker wrapper image development: Gaetano Perrone, Francesco Caturano**


Thanks to **Giuseppe Criscuolo** for the logo design
## Changelog   
Got to [CHANGELOG.md](CHANGELOG.md) to see al the version changes.   

## License
This project is under the **MIT license**
