#!/bin/bash

set -eu

readonly frm2png=tools/frm2png/Build/frm2png

if [[ ! -f "$frm2png" ]]; then
   echo ::group::frm2png
   git clone --recurse-submodules https://github.com/rotators/frm2png.git tools/frm2png
   cmake -S tools/frm2png/Source -B tools/frm2png/Build
   cmake --build tools/frm2png/Build
   echo ::endgroup::
fi

# while frm2png can process multiple files at once,
# it can't really be used here as output is intended to be in different directory with normalized filename

function png-name()
{
    local frm="$1"
    local dir=
    if (( $# > 1 )); then
       dir="_$2"
    fi

     frm="${frm//\.\//}"
     frm_dir="$(dirname "$frm")"
     frm_base="$(basename "$frm")"
     frm_name="${frm_base%.*}"

     echo "docs/$frm_dir/${frm_name^^}${dir}.png"
}

#

rm -fr docs

#

find . -iname "*.frm" | sort | while read frm; do

     echo "::group::${frm//\.\//}"

     mkdir -p "docs/$(dirname "$frm")"
     $frm2png -g anim -o "$(png-name "$frm")" "$frm"
     $frm2png -g anim-packed -o "$(png-name "$frm")" "$frm" > /dev/null

     echo ::endgroup::
done

#

for dir in $(seq 0 5); do
    find . -iname "*.fr$dir" | sort | while read frm; do
         echo "::group::${frm//\.\//}"

         mkdir -p "docs/$(dirname "$frm")"
         $frm2png -g anim -o "$(png-name "$frm" $dir)" "$frm"

         echo ::endgroup::
    done

    find docs/ -iname "*_${dir}_0.png" | while read png; do
         png_new="${png//_${dir}_0/_${dir}}"
         mv "$png" "$png_new"
    done
done

#

cd docs

tree -H . -P *.png > index.html
