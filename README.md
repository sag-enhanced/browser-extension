# SAGE Extension

If you just want to install the extension, read the
[documentation](https://docs.sage.party/extension#installing).

## Building

Requirements:
- Node and NPM (anything above >16 should work)
- Any operating system should work

1. Run `npm i` to install all dependencies.

2. Run `npm run build` to build (or `npm run dev` for development builds)

The build output will be in the `out` directory.


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
