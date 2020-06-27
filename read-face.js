#!/usr/bin/env node

const debug = require('debug')
const commander = require('commander')
const { version } = require('./package')
const lib = require('./lib')

const {
  argv,
  env: {
    DEBUG = '@sequencemedia/make-face'
  }
} = process

commander
  .version(version)
  .option('-p, --path <path>', 'The location from which to read CSS files')
  .option('-f, --file <file>', 'The file to which to write the object')
  .option('--silent', 'Silent running')
  .parse(argv)

debug.enable(DEBUG)

/*
 *  TODO:
 *  maxBuffer!
 */
lib.readFaceFromCMD(commander.silent, commander.path, commander.file)
  .then(() => process.exit())
