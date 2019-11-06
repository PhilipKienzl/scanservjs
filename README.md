# simple mod
of scanservjs to support the automatic document feeder (Epson Stylus SX6200FW)
after Scan is hit, you can choose to scan Flatbed / odd pages / even pages and finally merge the tifs to pdf.
After odd pages are scanned you can just merge these for single sided docs or
scan the even pages and then merge all tifs into one single pdf file
merging is done by a simple bash script ("merge.sh")

# dependency
libtiff-tools

# scanservjs
scanservjs is a nodejs port of scanserv. It's a simple web-based UI for SANE 
which allows you to share a scanner on a network without the need for drivers 
or complicated installation. scanservjs does not do image conversion or 
manipulation (beyond the bare minimum necessary for the purposes of browser 
preview) or OCR.

![screenshot](https://github.com/sbs20/scanservjs/raw/master/docs/screen0.png)

Copyright 2016	[Sam Strachan](https://github.com/sbs20)

# requirements
  * SANE
  * ImageMagick
  * nodejs

# installation notes
 * Installation notes [here](docs/install.md)

# background
This is yet another scanimage-web-front-end. Why?

 * I wanted a simple server which would simply scan an image with as little
   dependency on other software as possible. I already have Photoshop / GIMP
   I don't need a webapp to do that stuff
 * Desire for easier and cleaner set up and configuration
 * Separation of presentation and control logic with json-rpc
 * I just wanted to

# roadmap
 * ES2016
 * Setup page (auto diagnostics)
 * Configuration page for debugging set up assisting new users
 * Multi-language support

# acknowledgements
 * This project owes a lot to [phpsane](http://sourceforge.net/projects/phpsane/)
 * In many respects phpsane is more powerful than this. Scanservjs does not 
   support jpeg conversion or OCR. phpSANE, however, is also more brittle and 
   somewhat dated in its implementation.
   
# more about SANE
 * http://www.sane-project.org/
