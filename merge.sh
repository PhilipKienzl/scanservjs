#!/bin/bash
outdir=${1}
evenlen=`/bin/ls ${outdir}even/ | wc -l`
oddlen=`/bin/ls ${outdir}odd/ | wc -l`
echo $oddlen
echo $evenlen
catstr=""
now=`/bin/date +"%m_%d_%Y"`
oclock=`/bin/date +"%T"`
oclock=${oclock//:/_}

outputfilename=${now}"-"${oclock}

if ([ $oddlen -gt 0 ] && [ $evenlen -eq 0 ])
then
catstr=${outdir}"odd/*.tif"
fi

if [ $oddlen -gt 0 ] && [ $evenlen -gt 0 ]
then
echo "Double sided"
for page in $(seq 1 $oddlen)
do
catstr+=${outdir}"odd/out"${page}".tif ${outdir}even/out"${evenlen}".tif "
let "evenlen = $evenlen - 1"
done
fi

if [ "$catstr" != "" ]
then
/usr/bin/tiffcp -c lzw ${catstr} ${outdir}output.tif
/usr/bin/tiff2pdf ${outdir}output.tif > ${outdir}${outputfilename}".pdf"
#remove processed files
/bin/rm ${outdir}odd/*
/bin/rm ${outdir}even/*
/bin/rm ${outdir}output.tif
fi
