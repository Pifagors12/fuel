#!/bin/bash

ROOT=$(cd "$(dirname "$0")/.."; pwd)

FILES=$(find $ROOT/apps -name '*.test.ts')

if [[ $* == *--all* ]]; then
  grep -lE "@group\s+(node|browser|e2e)" $FILES
elif [[ $* == *--browser* ]]; then
  grep -lE "@group\s+browser" $FILES
elif [[ $* == *--node* ]]; then
  grep -lE "@group\s+node" $FILES
elif [[ $* == *--e2e* ]]; then
  grep -lE "@group\s+e2e" $FILES
fi