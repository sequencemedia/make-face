#!/usr/bin/env node

const {
  Command
} = require('commander')

const {
  version
} = require('./package')

const {
  makeFace
} = require('./lib')

const commander = new Command()

const {
  argv
} = process

commander
  .version(version)
  .requiredOption('-f, --from-directory <directory path>', 'The directory from which to read the font files')
  .requiredOption('-t, --to-directory <directory path>', 'The directory in which to write the CSS files')
  .parse(argv)

const {
  fromDirectory,
  toDirectory
} = commander.opts()

makeFace(fromDirectory, toDirectory)
