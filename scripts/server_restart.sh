isStarted=0;
if [ -z ${1+x} ];
  then echo "Pls send variable path"
else
DSP_PATH=${1};
mainDSP=${1}/index.js
  forever list --plain --no-colors | awk '{print $5}' > ${DSP_PATH}/scripts/runningList.txt
  # has already started?
  for processName in $(cat  ${DSP_PATH}/scripts/runningList.txt);
  do
    if [ "$processName" = "index.js" ]; then
          isStarted=1
      fi
    done
  echo "cd $DSP_PATH";
  cd $DSP_PATH
  if [ $isStarted -eq 1 ]; then
    #Already started
    echo "Restart server...";
    forever restart -a -l ${DSP_PATH}/logs/forever.log -o ${DSP_PATH}/logs/out.log -e ${DSP_PATH}/logs/err.log index.js
  else
    echo "Start server...";
    forever start  -a -l ${DSP_PATH}/logs/forever.log -o ${DSP_PATH}/logs/out.log -e ${DSP_PATH}/logs/err.log index.js
  fi
fi
  #rm ${DSP_PATH}/scripts/runningList.txt
