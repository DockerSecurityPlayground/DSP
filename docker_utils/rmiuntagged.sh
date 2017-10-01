docker rmi $(docker images  | awk ' $2 == "<none>" {print $3}')
