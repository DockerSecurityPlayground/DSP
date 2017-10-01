#!/bin/sh

function print_error {
      echo " ${0}:usage: [<ip> <container_name>  to search container's ip] | <rmall> to remove all containers <uadd> {username} {password} {name_container} to add a username to debian container <cp> <container_name> <file_to_load> {directory_server} to copy a file inside a container"  
      exit 1 # Command to come out of the program with status 1
}

option="${1}" 
case ${option} in 
     ip) 
	HOST_NAME="${2} "o

	## Check number of parameters 
	if [ "$#" -ne 2 ]; then
	echo $#
	print_error
	fi
	# Ok right number
	docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker-compose ps -q $2)
     ;;
   rmall) 
	docker rm -f $(docker ps -a -q)
    ;;


  cp) 
	if [[ "$#" -ne 3 ]] && [[ "$#" -ne 4 ]]; then
	echo $#
	print_error
	fi 
	

	if [ "$#" -eq 3 ]; then
	docker cp $3  "$(docker-compose ps -q $2)":/$3
	else
	docker cp $3  "$(docker-compose ps -q $2)":/$4
	fi 
	;;

	
   uadd) 
	if [ "$#" -ne 4 ]; then
	echo $#
	print_error
	fi
	#add an user, create a mkhomedir
	docker-compose exec $4 adduser.sh  $2 $3
	;;
   *) print_error 
      ;; 
esac 
#GET ADDRESS OF A CONTAINER
#docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' internal_host
