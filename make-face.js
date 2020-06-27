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
  .option('-s, --src_path <src_path>', 'The location from which to read font files')
  .option('-c, --css_path <css_path>', 'The location at which to write CSS files')
  .option('--silent', 'Silent running')
  .parse(argv)

debug.enable(DEBUG)

lib.makeFaceFromCMD(commander.silent, commander.src_path, commander.css_path)
  .then(() => process.exit())
