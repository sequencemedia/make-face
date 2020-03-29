#!/usr/bin/env node

const commander = require('commander')
const { version } = require('./package')
const lib = require('./lib')

commander
  .version(version)
  .option('-p, --path <path>', 'The location from which to read CSS files')
  .option('-f, --file <file>', 'The file to which to write the object')
  .option('--silent', 'Silent running')
  .parse(process.argv)

/*
 *  TODO:
 *  maxBuffer!
 */
lib.readFaceFromCMD(commander.silent, commander.path, commander.file)
  .then(() => process.exit())
