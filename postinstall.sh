#!/bin/bash

npx husky install
cp -ufv ./node_modules/bulma/css/bulma.min.css ./crx/dependencies
cp -ufv ./node_modules/lodash.flow/index.js ./crx/dependencies/lodash.flow/index.js
