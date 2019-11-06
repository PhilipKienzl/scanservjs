#!/bin/bash
evenlen=`ls even/ | wc -l`
oddlen=`ls odd/ | wc -l`
echo $oddlen
echo $evenlen
catstr=""
now=`date +"%m_%d_%Y"`
oclock=`date +"%T"`
oclock=${oclock//:/_}

outputfilename=${now}"-"${oclock}

if ([ $oddlen -gt 0 ] && [ $evenlen -eq 0 ])
then
echo "############## Converting to PDF ##############"
#Use tiffcp to combine output tiffs to a single mult-page tiff
tiffcp -c lzw odd/*.tif output.tif 
#Convert the tiff to PDF
tiff2pdf output.tif > data/output/${outputfilename}".pdf"
fi

if [ $oddlen -gt 0 ] && [ $evenlen -gt 0 ]
then
echo "Double sided"
for page in $(seq 1 $oddlen)
do
catstr+="odd/out"${page}".tif even/out"${evenlen}".tif "
let "evenlen = $evenlen - 1"
done
tiffcp -c lzw ${catstr} output.tif
tiff2pdf output.tif > data/output/${outputfilename}".pdf"
fi
echo "################ Cleaning Up ################"
rm odd/*
rm even/*
rm output.tif
