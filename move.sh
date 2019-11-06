#!/bin/bash
if [ "{1}" == "odd" ] 
then
mv out*.tif odd/
echo "Moved to odd"
elif [ "{1}" == "even" ]
then
mv out*.tif even/
echo "Moved to even"
fi
