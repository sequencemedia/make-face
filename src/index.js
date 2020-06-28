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

/**
 *  @returns {Promise}
 */
async function readFileFromFS (filePath) {
  /*
   *  log('readFileFromFS')
   */
  await ensureFile(filePath)

  return (
    readFile(filePath)
  )
}

/**
 *  @returns {Promise}
 */
async function writeFileToFS (filePath, fileData) {
  /*
   *  log('writeFileToFS')
   */
  await ensureFile(filePath)

  return (
    writeFile(filePath, fileData)
  )
}

/**
 *  @returns {Promise}
 */
function writeFileDataToFS ({ filePath, fileData }) {
  /*
   *  log('writeFileDataToFS')
   */
  return (
    writeFileToFS(filePath, fileData)
  )
}

/**
 *  @returns {Promise<Array>}
 */
function writeFileDataListToFS (fileDataList) {
  /*
   *  log('writeFileDataListToFS')
   */
  return (
    Promise.all(fileDataList.map(writeFileDataToFS))
  )
}

/**
 *  @returns {Promise<Object>}
 */
async function readFileDataFromFS (filePath) {
  /*
   *  log('readFileDataFromFS')
   */
  const fileData = await readFileFromFS(filePath)

  return {
    filePath,
    fileData
  }
}

/**
 *  @returns {Promise<Array>}
 */
function readFileDataListFromFS (filePathList) {
  /*
   *  log('readFileDataListFromFS')
   */
  return (
    Promise.all(filePathList.map(readFileDataFromFS))
  )
}

const getStatError = (e, p) => (
  (e.code === 'ENOENT')
    ? `Path "${p}" does not exist.`
    : (p)
      ? `An error occurred on path "${p}": ${e.message}`
      : 'Path is not defined.'
)

/**
 *  @returns {Promise}
 */
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

/**
 *  @returns {String}
 */
const getSrcFileGlob = (directory) => path.join(directory, SRC_GLOB)

/**
 *  @returns {String}
 */
const getCSSFileGlob = (directory) => path.join(directory, CSS_GLOB)

/**
 *  @returns {Promise<Array>}
 */
function getFilePathList (filePath) {
  return new Promise((resolve, reject) => {
    glob(filePath, (e, filePathList) => (!e) ? resolve(filePathList) : reject(e))
  })
}

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
function getCSSFilePathList (directory) {
  return (
    getFilePathList(getCSSFileGlob(directory))
  )
}

/**
 *  @returns {Boolean}
 */
function findCSSFilePathFactory (cssFilePath, srcPath, cssPath) {
  return function findCSSFilePath ({ filePath }) {
    return cssFilePath === transformSrcFilePathToCSSFilePath(filePath, srcPath, cssPath)
  }
}

/**
 *  @returns {String}
 */
const getFontMimeType = (filePath) => mime.getType(filePath)

/**
 *  @returns {String}
 */
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

/**
 *  @returns {String}
 */
const transformSrcFilePathToCSSFilePath = (filePath, srcPath, cssPath) => filePath.replace(new RegExp(path.extname(filePath).concat('$')), '.css').replace(new RegExp('^'.concat(srcPath)), cssPath)

/**
 *  @returns {String}
 */
const transformToFontFamily = (filePath) => path.basename(filePath, path.extname(filePath))

/**
 *  @returns {String}
 */
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
const createCSSFileDataFromCSSFilePathList = (filePathList) => {
  const [
    {
      filePath
    }
  ] = filePathList

  return `/**
${filePathList.map(({ filePath }) => ` *  "${filePath}"`).join('\n')}
 */
@font-face {
  font-family: '${transformToFontFamily(filePath)}';
  src: ${filePathList.map(({ filePath, fileData }) => transformToUrl(filePath, fileData)).join(', ')};
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
 *  @returns {Array}
 */
function createCSSFilePathListFromSrcFilePathList (srcFilePathList, srcPath, cssPath) {
  return (
    srcFilePathList.reduce((accumulator, { filePath: srcFilePath }) => { // , index, array) => {
      /*
       *  Create the css file path
       */
      const cssFilePath = transformSrcFilePathToCSSFilePath(srcFilePath, srcPath, cssPath)

      /*
       *  Create a filter function using the css file path
       */
      const findCSSFilePath = findCSSFilePathFactory(cssFilePath, srcPath, cssPath)

      /*
       *  Use the filter function to determine whether we have processed this css file path
       */
      if (accumulator.some(findCSSFilePath)) return accumulator

      /*
       *  Process this css file path by using the filter function to generate a list of file paths
       */
      const cssFilePathList = srcFilePathList.filter(findCSSFilePath)

      /*
       *  Create the css file data
       */
      const cssFileData = createCSSFileDataFromCSSFilePathList(cssFilePathList)

      return accumulator.concat({
        filePath: cssFilePath,
        fileData: cssFileData
      })
    }, [])
  )
}

/**
 *  @returns {Promise<Array>}
 */
export async function makeFace (origin, destination) {
  log('Starting ...')

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
     *  Read files at `origin` to file path list array
     */
    log(`Reading faces from "${origin}"`)

    const srcFileDataList = await readFileDataListFromFS(await getSrcFilePathList(origin))
    const cssFileDataList = await createCSSFilePathListFromSrcFilePathList(srcFileDataList, origin, destination)

    /*
     *  Transform and write to `destination`
     */
    log(`Writing faces to "${destination}"`)

    await writeFileDataListToFS(cssFileDataList)

    log('Done.')

    return (
      cssFileDataList.map(({ fileData }) => fileData)
    )
  } catch ({ message }) {
    log(message)
  }
}

/**
 *  @returns {Promise<String>}
 */
export async function readFace (origin, destination) {
  log('Starting ...')

  try {
    /*
     *  Does `origin` exist?
     */
    await statPath(origin)

    /*
     *  Read files at `origin` to file path list array
     */
    log(`Reading faces from "${origin}"`)

    const cssFileDataList = await readFileDataListFromFS(await getCSSFilePathList(origin))
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
  } catch (e) {
    const { message } = e

    log(message)

    log(e)
  }
}
