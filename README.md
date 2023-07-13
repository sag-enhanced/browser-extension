# SAGE Extension

If you just want to install the extension, read the
[documentation](https://docs.sage.party/extension#installing).

## Building

1. Run `npm i` to install all dependencies.

2. For development builds, run `npm run dev`

3. For production builds, run `npm run build`.

## Development build

The development build includes:

- a bit more debug output
- source maps
- no minification

## Making a release

1. Update the version in `static/manifest.json`
2. Run `npm run build`
3. Submit to webstores:
   - [Firefox](https://addons.mozilla.org/en-GB/developers/addon/b616405da9bb43558ed6/versions/submit/)
