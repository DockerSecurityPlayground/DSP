# DockerSecurityPlayground
![alt text](https://raw.githubusercontent.com/giper45/DockerSecurityPlayground/master/public/assets/img/dsp_logo.png)



Docker Security Playground is an application that allows you to: 
- Create **network and network security scenarios**, in order to understand all the network protocols,  
rules, and security issues with host networks. . 
- To Learn **penetration testing techniques** by simulating vulnerability labs scenarios
-  **Manage a set of docker-compose project** . Main goal of DSP is to skilling 
in penetration testing and network security, but his flexibility allows you the 
**creation**, **graphic editing** and **managment run / stop** of all your **docker-compose
labs**. For more informations look at the [Labs Managment]() page. 

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
git pull
npm update
```

## Documentation   
For documentation go to Wiki page 
## History
TODO: Write history    

## Contributors   


* **Technical support**: Gaetano Perrone 
* **Documentation support** Gaetano Perrone
* **Application design: Gaetano Perrone, Simon Pietro Romano**
* **Application development: Gaetano Perrone**
* **Docker wrapper image development: Gaetano Perrone**


Thanks to **Giuseppe Criscuolo** for the logo design
## Changelog   
Got to [CHANGELOG.md](CHANGELOG.md) to see al the version changes.   

## License
This project is under the **MIT license**
