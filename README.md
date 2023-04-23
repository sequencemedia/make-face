# Make Face

Convert `otf`, `ttf`, `eot`, `svg`, `woff`, or `woff2` font files to CSS `@font-face {}` declarations with embedded data as `src: url()` (in `Base64`).

Always:

```bash
npm i @sequencemedia/make-face
```

## Logging

Logging is implemented with [`debug`](https://www.npmjs.com/package/debug) and can be enabled with the `@sequencemedia/make-face` namespace. This package will execute _silently_ without that namespace enabled

## Run from the command line

```bash
node make-face -f ~/from/file/path -t ~/to/file/path
```

```bash
node read-face -f ~/from/file/path -t ~/to/file/path/file.css
```

### With `debug`

```bash
DEBUG=@sequencemedia/make-face node make-face -f ~/from/file/path -t ~/to/file/path
```

```bash
DEBUG=@sequencemedia/make-face node read-face -f ~/from/file/path -t ~/to/file/path/file.css
```

## Make Face

Read font files from the file system and transform them to `css` files.

```javascript
import { makeFace } from 'make-face'

const fromDirectory = '~/origin/file/path'
const toDirectory = '~/destination/file/path'

makeFace(fromDirectory, toDirectory)
```

### With `debug`

```javascript
import debug from 'debug'
import { makeFace } from 'make-face'

debug.enable('@sequencemedia/make-face')

const fromDirectory = '~/origin/file/path'
const toDirectory = '~/destination/file/path'

makeFace(fromDirectory, toDirectory)

```

## Read Face

Read `css` files from the file system and concatenate them to another `css` file.

```javascript
import { readFace } from 'make-face'

const fromDirectory = '~/src/file/path'
const toFile = '~/destination/file/path/file.css'

readFace(fromDirectory, toFile)
```

### With `debug`

```javascript
import debug from 'debug'
import { readFace } from 'make-face'

debug.enable('@sequencemedia/make-face')

const fromDirectory = '~/src/file/path'
const toFile = '~/destination/file/path/file.css'

readFace(fromDirectory, toFile)
```
