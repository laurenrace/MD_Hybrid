# https://www.arj.no/2020/03/15/360-flattening/


# list devices
# ffmpeg -f avfoundation -list_devices true -i ""

# get info about device
# ffmpeg -f avfoundation -i "2:2"

# 1280x720@[14.985000 14.985000]fps
# choose device number 
 ffmpeg -f avfoundation -framerate 14.985000 -vf "crop=1280:640:0:0" -i "2:2"  -i ./ThetaS_remap_files/xmap_thetaS_1920x960v3.pgm -i ./ThetaS_remap_files/ymap_ThetaS_1920x960v3.pgm -filter_complex remap out.avi 

#   ffmpeg -f avfoundation -framerate 14.985000 -i "2:2" -vf "crop=1280:640:0:0" -i ./ThetaS_remap_files/xmap_thetaS_1920x960v3.pgm -i ./ThetaS_remap_files/ymap_ThetaS_1920x960v3.pgm -q 0 -lavfi "format=pix_fmts=rgb24,remap" out.avi 
# ffmpeg -f avfoundation -framerate 14.985000  -i "2:2" out.avi