import debug from 'debug'
import fs from 'fs-extra'
import path from 'path'
import mime from 'mime'
import glob from 'glob-all'
import {
  stat,
  writeFile,
  readFile
} from 'sacred-fs'

import CONSTANTS from './constants'

const log = debug('@sequencemedia/make-face')

const SRC_GLOB = `**/?(${CONSTANTS.formats.sort().map((format) => `*.${format}`).join('|')})`
const CSS_GLOB = '**/*.css'

/*
 *  Ensure a file path exists on the file system
 */
const ensureFile = (filePath) => (
  new Promise((resolve, reject) => {
    fs.ensureFile(filePath, (e) => (!e) ? resolve() : reject(e))
  })
)

async function readFileFromFS (filePath) {
  /*
   *  log('readFileFromFS')
   */
  await ensureFile(filePath)

  return (
    readFile(filePath)
  )
}

async function writeFileToFS (filePath, fileData) {
  /*
   *  log('writeFileToFS')
   */
  await ensureFile(filePath)

  return (
    writeFile(filePath, fileData)
  )
}

async function mapFilePathFromFS (filePath) {
  /*
   *  log('mapFilePathFromFS')
   */
  const fileData = await readFileFromFS(filePath)

  return {
    filePath,
    fileData
  }
}

async function mapFilePathToFS (filePath, fileData) {
  /*
   *  log('mapFilePathToFS')
   */
  await writeFileToFS(filePath, fileData)

  return {
    filePath,
    fileData
  }
}

/*
 *  Read each file path in a file path list to an array of objects with file path and file data fields
 */
function mapFilePathListFromFS (filePathList) {
  /*
   *  log('mapFilePathListFromFS')
   */
  return (
    Promise.all(filePathList.map(mapFilePathFromFS))
  )
}

/*
 *  Write each object with a file path and file data field in the file path list to a file
 */
function mapFileDataListToFS (filePathList) {
  /*
   *  log('mapFileDataListToFS')
   */
  return (
    Promise.all(filePathList.map(({ filePath, fileData }) => mapFilePathToFS(filePath, fileData)))
  )
}

const getStatError = (e, p) => (
  (e.code === 'ENOENT')
    ? `Path "${p}" does not exist.`
    : (p)
      ? `An error occurred on path "${p}": ${e.message}`
      : 'Path is not defined.'
)

async function statPath (directory) {
  /*
   *  log('statPath')
   */
  try {
    await stat(directory)
  } catch (e) {
    throw new Error(getStatError(e, directory))
  }
}

const getFileNameFromFilePath = (filePath) => path.basename(filePath, path.extname(filePath))

const getSrcFileGlob = (directory) => path.join(directory, SRC_GLOB)
const getCSSFileGlob = (directory) => path.join(directory, CSS_GLOB)
const getCSSFilePath = (directory) => path.join(path.dirname(directory), getFileNameFromFilePath(directory))

function getFilePathList (filePath) {
  return new Promise((resolve, reject) => {
    glob(filePath, (e, filePathList) => (!e) ? resolve(filePathList) : reject(e))
  })
}

const transformSrcFilePathToCSSFilePath = (filePath, srcPath, cssPath) => filePath.replace(new RegExp(path.extname(filePath).concat('$')), '.css').replace(new RegExp('^'.concat(srcPath)), cssPath)

const getFontMimeType = (filePath) => mime.getType(filePath)

/**
 *  @returns {Array}
 */
function getSrcFilePathList (directory) {
  return (
    getFilePathList(getSrcFileGlob(directory))
  )
}

/**
 *  @returns {Array}
 */
function createSrcFilePathList (directory) {
  return (
    getFilePathList(getCSSFileGlob(directory))
  )
}

function getFontFormat (filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase()
  switch (extension) {
    case 'ttf':
      return 'truetype'
    case 'otf':
      return 'opentype'
    case 'eot':
      return 'embedded-opentype'
    default:
      return extension
  }
}

const transformToUrl = (filePath, fileData) => `url(data:${getFontMimeType(filePath)};base64,${fileData.toString('base64')}) format('${getFontFormat(filePath)}')`

/**
 *  @returns {String}
 */
const createCSSFileDataLine = (filePath, fileData) => (`
/**
 *  "${filePath}"
 */
${fileData.replace(/^.*\/\*\*.*\n(?: \* +".*"\n)+ \*\/\n/gm, '').replace(/^\n+|\n+$/g, '')}
`)

/**
 *  @returns {String}
 */
const createCSSFileDataFromCSSFilePathList = (fileDataList) => {
  const [
    {
      filePath
    }
  ] = fileDataList

  return `/**
${fileDataList.map(({ filePath }) => ` *  "${filePath}"`).join('\n')}
 */
@font-face {
  font-family: '${getFileNameFromFilePath(filePath)}';
  src: ${fileDataList.map(({ filePath, fileData }) => transformToUrl(filePath, fileData)).join(', ')};
}
`
}

/**
 *  @returns {String}
 */
const createCSSFileDataFromCSSFileDataList = (fileDataList) => (
  fileDataList
    .reduce((accumulator, { filePath, fileData }) => accumulator.concat(createCSSFileDataLine(filePath, fileData.toString('utf8'))), '')
)

/**
 *  @todo Refactor as a reducer!
 */
function createCSSFilePathListFromSrcFilePathList (srcFilePathList, srcPath, cssPath) {
  const cssFileDataList = []

  while (srcFilePathList.length) {
    /*
     *  Extract the first item from the `srcFilePathList` collection
     */
    const srcFile = srcFilePathList.shift()

    /*
     *  Destructure its properties
     */
    const {
      filePath: srcFilePath
    } = srcFile

    /*
     *  Only the extension changes, so '/path/to/arial.ttf' matches '/path/to/arial.otf'
     *  as '/path/to/arial'
     */
    const filePath = getCSSFilePath(srcFilePath)

    /*
     *  Filter the `srcFilePathList` array to extract the other
     *  files with the same `fileName` and store them in the
     *  `cssFilePathList` array
     */
    const cssFilePathList = srcFilePathList
      .filter(({ filePath: f }) => filePath === getCSSFilePath(f))

    /*
     *  Remove those src files from the `srcFilePathList` array
     *  so that we don't process them again. (This will also reduce the length of
     *  the `srcFilePathList` array, and the number of loops we need to do)
     */
    cssFilePathList.forEach(({ filePath }) => srcFilePathList.splice(srcFilePathList.findIndex(({ filePath: f }) => filePath === f), 1))

    /*
     *  Ensure the first item from the `srcFilePathList` array is
     *  the first item of the `cssFilePathList` array we have created
     */
    cssFilePathList.unshift(srcFile)

    const cssFilePath = transformSrcFilePathToCSSFilePath(srcFilePath, srcPath, cssPath)
    const cssFileData = createCSSFileDataFromCSSFilePathList(cssFilePathList)

    const cssFile = {
      filePath: cssFilePath,
      fileData: cssFileData
    }

    /*
     *  Push this object onto the end of the `cssFileDataList` array
     */
    cssFileDataList.push(cssFile)
  }

  return cssFileDataList
}

export async function makeFace (origin, destination) {
  /*
   *  log('makeFace')
   */

  try {
    /*
     *  Does `origin` exist?
     */
    await statPath(origin)

    /*
     *  Does `destination` exist?
     */
    await statPath(destination)

    /*
     *  Read `origin` file path list then transform and write to `destination`
     */
    log(`Reading faces from "${origin}"`)

    const srcFileDataList = await mapFilePathListFromFS(await getSrcFilePathList(origin))
    const cssFileDataList = await createCSSFilePathListFromSrcFilePathList(srcFileDataList, origin, destination)

    log(`Writing faces to "${destination}"`)

    await mapFileDataListToFS(cssFileDataList)

    log('Done.')

    return (
      cssFileDataList.map(({ fileData }) => fileData)
    )
  } catch ({ message }) {
    log(message)
  }
}

export async function readFace (origin, destination) {
  /*
   *  log('readFace')
   */

  try {
    /*
     *  Does `origin` exist?
     */
    await statPath(origin)

    /*
     *  Read files at `origin` to file path list collection
     */

    log(`Reading faces from "${origin}"`)

    const cssFileDataList = await mapFilePathListFromFS(await createSrcFilePathList(origin))
    const cssFileData = createCSSFileDataFromCSSFileDataList(cssFileDataList)

    /*
     *  Transform and write to `destination`
     */

    log(`Writing faces to "${destination}"`)

    await writeFileToFS(destination, cssFileData)

    log('Done.')

    return (
      cssFileData
    )
  } catch ({ message }) {
    log(message)
  }
}
