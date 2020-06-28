#!/usr/bin/env node

const commander = require('commander')

const {
  version
} = require('./package')

const {
  readFace
} = require('./lib')

const {
  argv
} = process

commander
  .version(version)
  .option('-f, --from-directory <directory path>', 'The directory from which to read the CSS files')
  .option('-t, --to-file <file path>', 'The CSS file in which to write the concatenated CSS files')
  .parse(argv)

const {
  fromDirectory,
  toFile
} = commander

readFace(fromDirectory, toFile)
