#!/bin/python3

import sys
import os

from PyPDF2 import PdfFileReader, PdfFileWriter

pdf_file = open('Sample.pdf','rb')
pdf_reader = PdfFileReader(pdf_file)


pageNumbers = pdf_reader.getNumPages()

for i in range (pageNumbers):
    pdf_writer = PdfFileWriter()
    pdf_writer.addPage(pdf_reader.getPage(i))
    split_motive = open('Sample_' + str(i+1) + '.pdf','wb')
    pdf_writer.write(split_motive)
    split_motive.close()

pdf_file.close()
