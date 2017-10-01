#/bin/bash
TOEXCLUDE="ID";
for i in $(docker network ls  | awk '{print $2}'); 
do 
  if [[ "$i" != "$TOEXCLUDE" ]]; then
    docker network inspect $i -f '{{.Name}} /{{.IPAM}}' ; 
  fi
done
