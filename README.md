![Image of a sample network](https://addons.cdn.mozilla.net/user-media/previews/full/241/241867.png?modified=1595076034)

Rabbit Hole tracks your journey through Wikipedia to create a map of your knowledge base. You can then annotate links between articles and add your own notes thereby creating a small knowledge base of your own.

# Features

## Works in the background

Rabbit Hole works in the background while you browse. After you have browsed, simply click on the Rabbit Hole icon, select the Wikipedia page from the dropdown list and start exploring.

## Annotation and Notes

Using Rabbit Hole, you can also annotate the link b/w two pages as well as add notes.

Simply click on the line connecting two pages and add you annotations and Markdown notes.

# Downloads

1. [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rabbit-hole/)
2. [Chrome](https://chrome.google.com/webstore/detail/rabbit-hole/hpemmagcednhlipcekbeikmghgihahai?hl=en-GB)

# Development

The extension is written with TypeScript and does not use any framework (yet) for the viewer.

It uses the Promise-based `browser` namespace and uses the [WebExtensions Polyfill by Mozilla](https://github.com/mozilla/webextension-polyfill) for cross-browser compatibility with Chrome and chrome-like browsers (Edge).

To start contributing, simply clone the app -

- Run `npm ci`, using `ci` prevents npm from updating the lock file.
- Run `npm run build` to generate the assets.

Follow the browser specific guides to load the unpacked extension.

# License - [MIT](https://opensource.org/licenses/MIT)

Copyright 2020 Anirudh Varma

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
