Developer source, not required to run the offline app.
Python 3 builds the standalone HTML: python build.py
Node unit tests: copy ../field-data-check.html here, then node test.js
DOM emulation: install jsdom 30.1.3 in a development environment, then
node dom-test.js (requires that same HTML in this folder).
Build output is written here; replace ../field-data-check.html after review.
App itself has no dependencies. Test results are included as verification
records, not a substitute for the real-browser release checklist.
