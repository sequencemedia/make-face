# Make Face

Convert `otf`, `ttf`, `eot`, `svg` or `woff` font files to CSS `@font-face {}` declarations with data embedded in `Base64`.

Always:

```bash
npm i @sequencemedia/make-face
```

## Run from the command line

```bash
node make-face -f ~/from/file/path -t ~/to/file/path
```

```bash
node read-face -f ~/from/file/path -t ~/to/file/path/file.css
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
var readFace = require('make-face').readFace;

var fromDirectory = '~/origin/file/path';
var toFile = '~/destination/file/path/file.css';

readFace(fromDirectory, toFile);
```

### Using ES

```javascript
import { readFace } from 'make-face'

const fromDirectory = '~/src/file/path'
const toFile = '~/destination/file/path/file.css'

readFace(fromDirectory, toFile)
```
