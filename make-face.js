#!/usr/bin/env node

const commander = require('commander')

const {
  version
} = require('./package')

const {
  makeFace
} = require('./lib')

const {
  argv
} = process

commander
  .version(version)
  .option('-f, --from-directory <directory path>', 'The directory from which to read the font files')
  .option('-t, --to-directory <directory path>', 'The directory in which to write the CSS files')
  .parse(argv)

makeFace(commander.fromDirectory, commander.toDirectory)
