#!/bin/bash


for i in $(docker images | grep dsp | awk '{print $1}'); do docker rmi $i; done 
