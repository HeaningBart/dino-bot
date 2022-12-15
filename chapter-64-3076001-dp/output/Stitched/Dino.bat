python3.9 C:\SmartStitchConsole.py -i "JPEG" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90
mkdir CUNet
C:\waifu2x-ncnn-vulkan.exe -n 3 -s 1 -o ./CUNet -i ./Stitched -f jpg -j 2:2:2
C:/Rar.exe a CUNet.rar CUNet/*
rd /s /q "Stitched"