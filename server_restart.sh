mainDSP=${DSP_PATH}/index.js

isStarted=0;
if [ -z ${DSP_PATH+x} ]; 
  then echo "Pls set DSP_PATH variable in your environment"
else 
  forever list --plain --no-colors | awk '{print $5}' > ${DSP_PATH}/scripts/runningList.txt
  # has already started?
  for processName in $(cat  ${DSP_PATH}/scripts/runningList.txt); 
  do
    if [ "$processName" = "$mainDSP" ]; then
          isStarted=1
      fi
    done
  if [ $isStarted -eq 1 ]; then
    #Already started
    echo "Restart server...";
    forever restart -a -l ${DSP_PATH}/logs/forever.log -o ${DSP_PATH}/logs/out.log -e ${DSP_PATH}/logs/err.log ${DSP_PATH}/index.js
  else 
    echo "Start server...";
    forever start  -a -l ${DSP_PATH}/logs/forever.log -o ${DSP_PATH}/logs/out.log -e ${DSP_PATH}/logs/err.log ${DSP_PATH}/index.js
  fi
fi
  #rm ${DSP_PATH}/scripts/runningList.txt
