#!/usr/bin/env node

import {
  readFileSync
} from 'node:fs'

import {
  Command
} from 'commander'

import {
  makeFace
} from './src/index.mjs'

const {
  version
} = JSON.parse(readFileSync('./package.json'))

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
