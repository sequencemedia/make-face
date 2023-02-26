# Make Face

Convert `otf`, `ttf`, `eot`, `svg`, `woff`, or `woff2` font files to CSS `@font-face {}` declarations with embedded data as `src: url()` (in `Base64`).

Always:

```bash
npm i @sequencemedia/make-face
```

## Logging

Logging is implemented with [`debug`](https://www.npmjs.com/package/debug) and can be enabled with the `@sequencemedia/make-face` namespace. This package will execute _silently_ without that namespace enabled. (The command line and JS/ES import examples show how logging can be enabled)

## Run from the command line

```bash
DEBUG=@sequencemedia/make-face node make-face -f ~/from/file/path -t ~/to/file/path
```

```bash
DEBUG=@sequencemedia/make-face node read-face -f ~/from/file/path -t ~/to/file/path/file.css
```

## Make Face

Read font files from the file system and transform them to `css` files.

### Import using JS

```javascript
var makeFace = require('make-face').makeFace;

var fromDirectory = '~/origin/file/path';
var toDirectory = '~/css/file/path';

makeFace(fromDirectory, toDirectory);
```

### Import using ES

```javascript
import { makeFace } from 'make-face'

const fromDirectory = '~/origin/file/path'
const toDirectory = '~/destination/file/path'

makeFace(fromDirectory, toDirectory)
```

## Read Face

Read `css` files from the file system and concatenate them to another `css` file.

### Using JS

```javascript
var debug = require('debug');
var readFace = require('make-face').readFace;

debug.enable('@sequencemedia/make-face');

var fromDirectory = '~/origin/file/path';
var toFile = '~/destination/file/path/file.css';

readFace(fromDirectory, toFile);
```

### Using ES

```javascript
import debug from 'debug'
import { readFace } from 'make-face'

debug.enable('@sequencemedia/make-face')

const fromDirectory = '~/src/file/path'
const toFile = '~/destination/file/path/file.css'

readFace(fromDirectory, toFile)
```
