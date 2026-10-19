# Browser regression checks

Serve the repository over HTTP (`python3 -m http.server 8151`). These checks cover bugs reproduced during the review. They apply in both TH and EN.

1. Type a search and immediately select a lesson. After the search delay, the selected lesson must remain open. Type a search and immediately switch language: the entered query must be retained.
2. Open a middle section from the table of contents, then click the visible language control. The same section should remain at the reading line. Scroll away and click the same table-of-contents link again; it must return to that section even though the URL has not changed.
3. Focus the lesson tab and press ArrowRight, ArrowLeft, Home, and End. The selected tab must receive focus. Tab must then reach the panel. Opening a transcript must retain its original Thai text.
4. At a mobile viewport, the closed sidebar must be inert and absent from the keyboard order. Open it: focus must enter the navigation. Close it or press Escape: focus must return to the menu button. Selecting a lesson must close the menu and focus main content. Check for horizontal overflow and for a scrollable menu on a short viewport.
5. On a temporary copy, make only `lessons.en.json` unavailable and load from a fresh browser origin/cache. All five Thai lessons must remain usable, EN must be disabled, and the status must explain how to retry. Restore the file before publishing. If both catalogs are unavailable, a localized reload action must appear.
6. Mark a lesson complete, switch languages, and reload. Completion and language must persist. Search for text containing HTML characters; it must remain plain text.

Syntax checks: `node --check app.js` and `node --check i18n.js`.
