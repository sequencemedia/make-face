#!/usr/bin/env node

import {
  readFileSync
} from 'node:fs'

import {
  Command
} from 'commander'

import {
  readFace
} from './src/index.mjs'

const {
  version
} = JSON.parse(readFileSync('./package.json').toString())

const commander = new Command()

const {
  argv
} = process

commander
  .version(version)
  .requiredOption('-f, --from-directory <directory path>', 'The directory from which to read the CSS files')
  .requiredOption('-t, --to-file <file path>', 'The CSS file in which to write the concatenated CSS files')
  .parse(argv)

const {
  fromDirectory,
  toFile
} = commander.opts()

readFace(fromDirectory, toFile)
