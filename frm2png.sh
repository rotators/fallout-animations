#!/bin/bash

set -eu

readonly dir_output=docs
readonly frm2png=tools/frm2png/Build/frm2png
readonly options=

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
    local suffix=
    if (( $# > 1 )); then
       suffix="$2"
    fi

     frm="${frm//\.\//}"
     frm_dir="$(dirname "$frm")"
     frm_base="$(basename "$frm")"
     frm_name="${frm_base%.*}"

     echo "$dir_output/$frm_dir/${frm_name^^}${suffix}.png"
}

#

function ignore-frm()
{
    local frm="$1"
    local frm_base="$(basename "$frm")"
    local frm_anim=
    if [[ "${frm_base:0:1}" == "_" ]]; then
       frm_anim=${frm_base:7:2}
    else
       frm_anim=${frm_base:6:2}
    fi
    frm_anim=${frm_anim^^}

    if [[ $frm_anim == "NA" ]]; then
       return 0
    fi

    return 1
}

#

function process-frm()
{
    find . -iname "*.frm" | sort | while read frm; do
         echo "::group::${frm//\.\//}"

         if ignore-frm "$frm"; then
            continue
        fi

         mkdir -p "$dir_output/$(dirname "$frm")"
         $frm2png $options -g anim -o "$(png-name "$frm")" "$frm"
         # >/dev/null, so frm info will be displayed only once
         $frm2png $options -g anim-packed -o "$(png-name "$frm")" "$frm" > /dev/null
         $frm2png $options -g static -o "$(png-name "$frm" .static)" "$frm" > /dev/null

         echo ::endgroup::
    done
}

#

function process-frX()
{
    for dir in $(seq 0 5); do
        find . -iname "*.fr$dir" | sort | while read frm; do
             echo "::group::${frm//\.\//}"

             if ignore-frm "$frm"; then
                continue
             fi

             mkdir -p "$dir_output/$(dirname "$frm")"
             $frm2png $options -g anim -o "$(png-name "$frm" _$dir)" "$frm"
             # >/dev/null, so frm info will be displayed only once
             $frm2png $options -g static -o "$(png-name "$frm" _$dir.static)" "$frm" > /dev/null

             echo ::endgroup::
        done

        # frm2png adds "_<direction>" to filenames when using `anim` generator;
        # .fr[0-5] always use direction=0, so intended filename must be restored

        find $dir_output/ -iname "*_${dir}_0.png" | while read png; do
             png_new="${png//_${dir}_0/_${dir}}"
             mv "$png" "$png_new"
        done
    done
}

#

rm -fr $dir_output

process-frm
process-frX

(cd $dir_output && LC_COLLATE=C tree --sort=name -H . -P *.png > index.html)
echo
du -hd0 $dir_output/
