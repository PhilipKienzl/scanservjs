#!/bin/bash
evenlen=`/bin/ls even/ | wc -l`
oddlen=`/bin/ls odd/ | wc -l`
echo $oddlen
echo $evenlen
catstr=""
now=`/bin/date +"%m_%d_%Y"`
oclock=`/bin/date +"%T"`
oclock=${oclock//:/_}

outputfilename=${now}"-"${oclock}

if ([ $oddlen -gt 0 ] && [ $evenlen -eq 0 ])
then
catstr="odd/*.tif"
fi

if [ $oddlen -gt 0 ] && [ $evenlen -gt 0 ]
then
echo "Double sided"
for page in $(seq 1 $oddlen)
do
catstr+="odd/out"${page}".tif even/out"${evenlen}".tif "
let "evenlen = $evenlen - 1"
done
fi

if [ "$catstr" != "" ]
then
/usr/bin/tiffcp -c lzw ${catstr} output.tif
/usr/bin/tiff2pdf output.tif > data/output/${outputfilename}".pdf"
#remove processed files
/bin/rm odd/*
/bin/rm even/*
/bin/rm output.tif
