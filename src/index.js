/**
 * @typedef {Object} FileDescriptor
 * @property {string} filePath
 * @property {Buffer} fileData
 */

import debug from 'debug'
import {
  ensureFile
} from 'fs-extra'
import path from 'path'
import mime from 'mime'
import glob from 'glob-all'
import {
  stat,
  writeFile,
  readFile
} from 'fs/promises'

import FORMATS from './constants'

const log = debug('@sequencemedia/make-face')

const SRC_GLOB = `**/?(${FORMATS.sort().map((format) => '*.'.concat(format)).join('|')})`
const CSS_GLOB = '**/*.css'

/**
 *  @param {Error} e - Error
 *  @param {string|undefined} p - Path
 *  @returns {string}
 */
const getStatError = (e, p) => (
  (e.code === 'ENOENT')
    ? `Path "${p}" does not exist.`
    : (p)
        ? `An error occurred on path "${p}": ${e.message}`
        : 'Path is not defined.'
)

/**
 *  @param {string} filePath
 *  @returns {Promise<Buffer>}
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
 *  @param {string} filePath
 *  @param {Buffer} fileData
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
 *  @param {FileDescriptor}
 *  @returns {Promise<undefined>}
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
 *  @param {FileDescriptor[]} fileDataList
 *  @returns {Promise<undefined[]>}
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
 *  @param {string} filePath
 *  @returns {Promise<FileDescriptor>}
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
 *  @param {string[]} filePathList
 *  @returns {Promise<FileDescriptor[]>}
 */
function readFileDataListFromFS (filePathList) {
  /*
   *  log('readFileDataListFromFS')
   */
  return (
    Promise.all(filePathList.map(readFileDataFromFS))
  )
}

/**
 *  @param {string} directory
 *  @returns {Promise<undefined>}
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
 *  @param {string} directory
 *  @returns {string}
 */
const getSrcFileGlob = (directory) => path.join(directory, SRC_GLOB)

/**
 *  @param {string} directory
 *  @returns {string}
 */
const getCSSFileGlob = (directory) => path.join(directory, CSS_GLOB)

/**
 *  @param {string} filePath
 *  @returns {Promise<string[]>}
 */
function getFilePathList (filePath) {
  /*
   *  log('getFilePathList')
   */
  return new Promise((resolve, reject) => {
    glob(filePath, (e, filePathList) => (!e) ? resolve(filePathList) : reject(e))
  })
}

/**
 *  @param {string} directory
 *  @returns {Promise<string[]>}
 */
function getSrcFilePathList (directory) {
  /*
   *  log('getSrcFilePathList')
   */
  return (
    getFilePathList(getSrcFileGlob(directory))
  )
}

/**
 *  @param {string} directory
 *  @returns {Promise<string[]>}
 */
function getCSSFilePathList (directory) {
  /*
   *  log('getCSSFilePathList')
   */
  return (
    getFilePathList(getCSSFileGlob(directory))
  )
}

/**
 *  @param {string} cssFilePath
 *  @param {string} srcPath
 *  @param {string} cssPath
 *  @returns {Function}
 */
function findCSSFilePathFactory (cssFilePath, srcPath, cssPath) {
  /*
   *  log('findCSSFilePathFactory')
   */
  return function findCSSFilePath ({ filePath }) {
    /*
     *  log('findCSSFilePath')
     */
    return cssFilePath === getCSSFilePathFromSrcFilePath(filePath, srcPath, cssPath)
  }
}

/**
 *  @param {string} filePath
 *  @returns {string}
 */
const getFontMimeType = (filePath) => mime.getType(filePath)

/**
 *  @param {string} filePath
 *  @returns {string}
 */
function getFontFormat (filePath) {
  /*
   *  log('getFontFormat')
   */
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
 *  @param {string} filePath
 *  @param {string} srcPath
 *  @param {string} cssPath
 *  @returns {string}
 */
function getCSSFilePathFromSrcFilePath (filePath, srcPath, cssPath) {
  /*
   *  log('getCSSFilePathFromSrcFilePath')
   */
  const extName = path.extname(filePath)

  return (
    filePath
      .replace(new RegExp(extName.concat('$')), '.css')
      .replace(new RegExp('^'.concat(srcPath)), cssPath)
  )
}

/**
 *  @param {string} filePath
 *  @returns {string}
 */
const transformToFontFamily = (filePath) => path.basename(filePath, path.extname(filePath))

/**
 *  @param {string} filePath
 *  @param {Buffer} fileData
 *  @returns {string}
 */
const transformToUrl = (filePath, fileData) => `url(data:${getFontMimeType(filePath)};base64,${fileData.toString('base64')}) format('${getFontFormat(filePath)}')`

/**
 *  @param {FileDescriptor[]} filePathList
 *  @returns {string}
 */
const transformToSrc = (filePathList) => filePathList.map(({ filePath, fileData }) => transformToUrl(filePath, fileData)).join(', ')

/**
 *  @param {string} filePath
 *  @param {Buffer} fileData
 *  @returns {string}
 */
const transformCSSFileDataListLine = (filePath, fileData) => {
  /*
   *  log('transformCSSFileDataListLine')
   */
  return `
/**
 *  "${filePath}"
 */
${fileData.toString('utf8').replace(/^.*\/\*\*.*\n(?: \* +".*"\n)+ \*\/\n/gm, '').replace(/^\n+|\n+$/g, '')}
`
}

/**
 *  @param {FileDescriptor[]} filePathList
 *  @returns {string}
 */
const transformCSSFilePathList = (filePathList) => {
  /*
   *  log('transformCSSFilePathList')
   */
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
  src: ${transformToSrc(filePathList)};
}
`
}

/**
 *  @param {FileDescriptor[]} fileDataList
 *  @returns {string}
 */
const transformCSSFileDataList = (fileDataList) => {
  /*
   *  log('transformCSSFileDataList')
   */
  return (
    fileDataList
      .reduce((accumulator, { filePath, fileData }) => accumulator.concat(transformCSSFileDataListLine(filePath, fileData)), '')
  )
}

/**
 *  @param {FileDescriptor[]} filePathList
 *  @returns {Buffer}
 */
const createCSSFileDataFromCSSFilePathList = (filePathList) => Buffer.from(transformCSSFilePathList(filePathList))

/**
 *  @param {FileDescriptor[]} fileDataList
 *  @returns {Buffer}
 */
const createCSSFileDataFromCSSFileDataList = (fileDataList) => Buffer.from(transformCSSFileDataList(fileDataList))

/**
 *  @param {FileDescriptor[]} cssFileDataList
 *  @param {string} cssFilePath
 *  @returns {FileDescriptor}
 */
function transformToCSSFileDataFromCSSFileDataList (cssFileDataList, cssFilePath) {
  /*
   *  log('transformToCSSFileDataFromCSSFileDataList')
   */
  const cssFileData = createCSSFileDataFromCSSFileDataList(cssFileDataList)

  return {
    filePath: cssFilePath,
    fileData: cssFileData
  }
}

/**
 *  @param {FileDescriptor[]} srcFilePathList
 *  @param {string} srcPath
 *  @param {string} cssPath
 *  @returns {FileDescriptor[]}
 */
function transformToCSSFileDataListFromSrcFilePathList (srcFilePathList, srcPath, cssPath) {
  /*
   *  log('transformToCSSFileDataListFromSrcFilePathList')
   */
  return (
    srcFilePathList.reduce((accumulator, { filePath: srcFilePath }) => { // , index, array) => {
      /*
       *  Create the css file path
       */
      const cssFilePath = getCSSFilePathFromSrcFilePath(srcFilePath, srcPath, cssPath)

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
 *  @param {string} origin
 *  @param {string} destination
 *  @returns {Promise<FileDescriptor[]>}
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
    const cssFileDataList = transformToCSSFileDataListFromSrcFilePathList(srcFileDataList, origin, destination)

    /*
     *  Transform and write to `destination`
     */
    log(`Writing faces to "${destination}"`)

    await writeFileDataListToFS(cssFileDataList)

    log('Done.')

    return (
      cssFileDataList
    )
  } catch ({ message }) {
    log(message)
  }
}

/**
 *  @returns {Promise<FileDescriptor>}
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
    const cssFileData = transformToCSSFileDataFromCSSFileDataList(cssFileDataList, destination)

    /*
     *  Transform and write to `destination`
     */
    log(`Writing faces to "${destination}"`)

    await writeFileDataToFS(cssFileData)

    log('Done.')

    return (
      cssFileData
    )
  } catch ({ message }) {
    log(message)
  }
}
