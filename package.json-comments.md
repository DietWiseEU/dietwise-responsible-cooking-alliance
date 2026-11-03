# Comments about the package.json

Since JSON does not allow comments and since `package.json` is central for any JS project and the
heart of its configuration, let's keep here any comments, decisions, design notes etc.

## Held back

Document any packages that are deliberately held back.

Format is:

> ### package-name - pinned version - newest version
>
> Reasoning...

### eslint - 9.39.5 - 10.14.0

`eslint-plugin-react@7.37.5`, its latest release, declares the peer range
`eslint@"^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7"`, so `npm install` fails with ERESOLVE on ESLint 10.
Every other ESLint plugin we use already accepts ESLint 10. Do not bypass this with `--legacy-peer-deps`
or `overrides`: ESLint 10 removed APIs, and the plugin is loaded through `FlatCompat`
(`plugin:react/jsx-runtime`), so breakage is plausible and would be untested.

Upgrade once `eslint-plugin-react` publishes a release whose peer range includes `^10`. Note that npm
reports `eslint@9.39.5` as deprecated ("This version is no longer supported"), so this hold should not
last long; if `eslint-plugin-react` stays stalled, consider replacing it.

### @eslint/js - 9.39.5 - 10.0.1

Must match the major version of `eslint` (`@eslint/js@10` has the peer `eslint@^10`). Held back together
with `eslint`, see above.

### @types/chrome - 0.2.9 - 0.3.7

`@types/chrome@0.3.x` declares a global `declare var browser: typeof chrome;`. Our `tsconfig.json` loads
both `chrome` and `firefox-webext-browser` types globally, so this clobbers the Firefox `browser`
namespace: `browser.sidebarAction` and namespace types such as `browser.storage.StorageChange` and
`browser.tabs._OnActivatedActiveInfo` stop resolving, and `tsc` fails. The clash itself is not reported,
because `skipLibCheck` is enabled.

Upgrading requires separating the Chrome and Firefox typings (for example, not loading both globally),
rather than just a version bump.

## ERESOLVE when updating @vitejs/plugin-react

Bumping `@vitejs/plugin-react` can fail with:

> npm error Conflicting peer dependency: @babel/core@8.0.1
>
> peer @babel/core@"^8.0.0" from @babel/plugin-transform-runtime@8.0.1
> peerOptional @babel/plugin-transform-runtime@"^7.29.0 || ^8.0.0-rc.1" from @rolldown/plugin-babel
> peerOptional @rolldown/plugin-babel@"^0.1.7 || ^0.2.0" from @vitejs/plugin-react

`@rolldown/plugin-babel` is an optional peer of `@vitejs/plugin-react` and is not part of our tree.
Its own optional peer range on `@babel/plugin-transform-runtime` admits Babel 8, which demands
`@babel/core@^8`, while `@svgr/*` and `eslint-plugin-react-hooks` require `@babel/core@^7`. npm
walks that optional chain only when reconciling against an existing `package-lock.json`; resolving
the same `package.json` from scratch skips `@rolldown/plugin-babel` entirely and installs cleanly.

The fix is to delete the `node_modules/@babel/core` entries from `package-lock.json` and run
`npm install`, which re-resolves that node within the `^7` range. Do not reach for `--force` or
`--legacy-peer-deps`: they silence a constraint that is genuinely satisfiable. Deleting the whole
lockfile also works, but churns every transitive pin instead of the one that blocks resolution.

The workaround becomes unnecessary once `@rolldown/plugin-babel` excludes Babel 8 stable from its
peer range, or once the tree moves to `@babel/core@^8` throughout.
