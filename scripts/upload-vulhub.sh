#!/bin/bash
cdir=`pwd`
# Use vulhub json description to upload information.json 
cp vulhub.json /tmp/information.json
cp network.json /tmp/network.json
cd ~/git/vulhub/;
for f in `find . -type f  | grep docker-compose.yml`; do
    dir_name=`dirname $f`
    lab_name="vulhub-"`dirname $f | sed s#/#-#g | cut -c3- ` 
    echo $lab_name
    cd $dir_name
    cp /tmp/information.json information.json
    cp /tmp/network.json network.json
    touch .dsp
    zip -r /tmp/${lab_name}.zip *
    # To preserve the github vulhub structure
    rm information.json
    rm network.json
    cd -
done
cd $cdir
rm /tmp/information.json
rm /tmp/network.json