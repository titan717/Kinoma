/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "tv-banner-320x180.png",
    "revision": "b47799cc3528b7fcce02733dac730bba"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "1ffd5fc1628abc625f667b9c72b9a1b8"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3551802a65fb23c363fe29aaea8fe2fc"
  }, {
    "url": "pwa-192x192.png",
    "revision": "70502e4aff4318bf54c605130415e558"
  }, {
    "url": "index.html",
    "revision": "af42d5c65325fa1fc0c2bfcc8f9ce0dc"
  }, {
    "url": "icon.svg",
    "revision": "4663147d6d8b1dcdaf2b41854e2eb993"
  }, {
    "url": "favicon.ico",
    "revision": "3d7fd5e7b554ebb41b7fd63ae6af5988"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a21ac37d23870d5958ebd608eb861b3a"
  }, {
    "url": "assets/index-CnWh2bN_.css",
    "revision": null
  }, {
    "url": "assets/index-CisZ-gGa.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a21ac37d23870d5958ebd608eb861b3a"
  }, {
    "url": "favicon.ico",
    "revision": "3d7fd5e7b554ebb41b7fd63ae6af5988"
  }, {
    "url": "icon.svg",
    "revision": "4663147d6d8b1dcdaf2b41854e2eb993"
  }, {
    "url": "pwa-192x192.png",
    "revision": "70502e4aff4318bf54c605130415e558"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3551802a65fb23c363fe29aaea8fe2fc"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "1ffd5fc1628abc625f667b9c72b9a1b8"
  }, {
    "url": "tv-banner-320x180.png",
    "revision": "b47799cc3528b7fcce02733dac730bba"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4b3defea30dcf6c21b43d9f44f382567"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
