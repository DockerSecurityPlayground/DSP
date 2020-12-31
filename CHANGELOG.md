# Change Log
All notable changes to this project will be documented in this file.
## Next Developments 
 * Fix of Angular WebSocket Code during installation long running
 * New terminal on a new tab in visual editor     
 * Fix the .data bug (delete when .data is empty)   

## [master]
### Fixed   
 * Intermittent on header   
 * Labs ng-repeat to show properly each lab    
 * Readme if exist, graph otherwise
 * Removed sidebar 

### Removed  
 * repo image panel: it requires too much response time. Now users can see not downloaded images in lab section. 

### Added   
 * README support: now lab editors can add a README and could it can be seen on main page of lab projects. 
 * Upload lab support: now dsp can take labs from other sources   
 

## [3.8.0] - 2020 - 12- 31
 * Fix the filterImage bug in edit container page OK
 * Fix label if does not exist in lab 
 * Different vertical size image canvas
 * Changed dsp port (18181)   
 * Added vulhub repository during installation
 * Fixed some size typo in images.html section   
 * Avoid removing ports when the element image is changed  


<!-- ## [3.8.0] - 2020 - 12 - 24    -->


## [3.7.11] - 2020 - 12 - 23
### Fixed  
Issue on manage multiple networks

## [3.7.10] - 2020 - 12 - 18
### Changed   
HOSTNAME -> DSP_IFACE environment variable to avoid conflicts.   


## [3.7.9] - 2020 - 12 - 12  
###  
- Removed com and com.docker labels when a lab is saved.   

## [3.7.8] - 2020 - 07 - 28
### Added  
- Support hostname

## [3.7.7] - 2020 - 07 - 16  
### Changed   
- Changed network_mode to host for wireshark monitoring service
## [3.7.6] - 2020 - 07 - 15
### Fixed  
- Disable require for email field during installation;  
### Added  
- goal and solution editing in lab usage interface;   
- Restart button on edit network container  
- DSP Repo to official repositories
 
## [3.7.5] - 2020 - 07 - 03  
### Fixed  
- Upload directories closed by default. 

## [3.7.4] - 2020 - 06 - 17  
### Fixed  
- DSP crashes in command line if already does not exist  
- Edit network even if lab is run
- Fixed run service cap add NETWORK_ADMIN
- Added browser managed service


## [3.7.0] - 2020 - 06 - 16  
### Fixed  
- Anchor on images page for 2 labs that belong to different repositories
- Update tree on the left when the user adds a new lab or when a lab is stopped
- Network Graph issues (i.e. select element on the left)

### Added   
- Drop down labs menu collapsed by default in sidebar  
- Running labs in homepage  
- Loading images spinner in Images Manager  
- Labs state in sidebar drop down menus  
- Download lab missing images from lab view  
- Download user defined Docker Image from edit container view  


## [3.6.5] - 2020 - 06 - 08
- Updated application dependencies in package.json

## [3.6.4] - 2020 - 05 - 05
- Fixed bug in network graph  
- Fixed bug in network commands

## [3.6.1] - 2020 - 05 - 01
- Collapsed repos by default
## [3.6.2] - 2020 - 04 - 26
- Fixed title in docker containers
- Fixed width and title
- Fixed width height in ports to improve usability
- Removed label in graph sidebar to improve usability

## [3.6.1] - 2020 - 04 - 25
- Fixed error in subnet change

## [3.6.0] - 2020 - 04 - 22
- Added snippet function in Dockerfile
- Implemented private git repository support
- Added monitoring support
- Added managed services support

## [3.5.1] - 2020 - 04 - 17
- Added network graph enchancements
- Added tags guide in description

## [3.4.0] - 2019 - 12 - 21
- New theme by diterlizzi
## [3.3.2] - 2019 - 12 - 17  
- Added back button to edit network or element  
- Save compose upon editing of nodes / networks
## [3.3.0] - 2019 - 12 - 05
- Host network support
- Default oneline
- Single page hacktools
- Redirect stderr to stdout when run oneline (see dirhunt)
Versioning of Docker Security Playground 



## [3.2.4] - 2019 - 11 - 23  
- Added dockersecplayground username in tag of docker build
## [3.2.3] - 2019 - 09 - 08
- Fixed pty exception crashes when col or row is null



## [3.2.0] - 2019 - 09 - 08
- Added ctf and exec default actions for images  
- Vagrant with vbguest
## [3.1.1] - 2019 - 08 -29
- Added git and copy support
- Fixed executable file
## [3.1.0] - 2019 - 08 -27
- Added .dockerfiles and Dockerfile build feature
- Fixed test environment
## [3.0.0] - 2019 - 08 -03
### Added  
New Graph editor created  
Alignment of toolbar
### Changed
Integrated the lab graph inside the single page application (no graph_editor / graph_action pages)  
Refactored HackTools 
### Removed   
Old graph pages 



## [2.3] - 2019-03-12
Image checking added and progress bar for images implemented
Added anchor to images
Added reference from images path to lab

## [2.2] - 2018-11-29
Multiple repositories support added

## [2.1] - 2018-10-01
 Fix space names network allowed bug


## [2.0] - 2018-09-01
 Hack tools implemented
 

## [1.6] - 2017-01-19
 Fix bug of docker images with cmd label
 Docker network ip visibility implemented
 Docker compose file visibility implemented
## [1.5] - 2017-07-07
 In all the code "Drawed" variables are changed to "ToDraw" variables;
 Strange error lowercases in util/ws_handlers.js fixed.
 
## [1.4.2] - 2017-05-17
ALL Cap inserted, daemon for the process in order to execute backgdound process such as bots

## [1.4.1] - 2017-05-16    
### Changed    
Fix the pull repository bug.
## [1.4] - 2017-05-15  
### Added   

Long opts and short parameters in interface with docker wrapper images, now it's possible to insert boolean flag (such as -v, -h) they are transformed in checkbox on interface
### Changed  
The arguments are not with the following convention : --key=value but with "--key value", so it isn't necessary to insert wrapper bash scripts for default Linux commands such ass iptable but only the labels

## [1.3.2] - 2017-05-13
### Added
  - Implemented optional choices of capabilities, no static CAP_NET cap, but flexible with docker wrapper images convention
  - Moved the installation of base images inside a script in scripts directory (scripts/install_deps_images.sh), this will be runned during the dependents installation.

## [1.3.1] - 2017-05-12
### Changed
Add a check during editor of a container. The user cannot exit from editor if he doesn't click edit or cancel, this make more comprehensible for the user if the container  is modified
## [1.3.0] - 2017-05-12
### Changed
In graph_editor there was a bug: when an image was changed the ports weren't resetted. Now this issue is resolved.

## [1.2.0] - 2017-05-11
### Added
   - Added the installation script for Ubuntu: "/scripts/ubuntu_deps_install.sh"
