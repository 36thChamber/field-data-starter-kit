FIELD DATA CHECK — BETA 0.1.0
An offline CSV review utility for field-data workflows.

START
1. Extract the ZIP to a normal folder.
2. Open field-data-check.html in a modern desktop browser. No installation,
   server, internet connection, account or API key is required by the app.
3. Try the synthetic sample, or choose a UTF-8 CSV from your computer.
4. Inspect the detected delimiter and preview. Select comma, semicolon or tab
   explicitly if automatic detection is ambiguous or wrong.
5. Map Record ID, Latitude and Longitude. Date-format validation can be disabled.
6. Run checks and review the findings. Export a separate QA report if needed.

INPUT CONTRACT
- CSV/TSV text encoded UTF-8 (optional BOM), not XLSX, PDF or a geospatial file.
- Up to 5 MiB, 20,000 source data records (including blank records before
  filtering), 100 columns. Display caps at 500 matching results; report exports
  include all checked records.
- Header names must be non-empty and unique after trimming.
- Strict CSV quoting: a quoted field starts at the beginning of the field;
  escaped quotes are doubled. Text after a closing quote is rejected.
- Entirely blank records are skipped. Other missing fields are flagged.
- Coordinates must already be decimal degrees in WGS84 with dot decimals.
  Comma decimals and thousands separators are not accepted. Scientific notation
  is accepted for coordinates. No coordinate conversion is performed.
- Dates use YYYY-MM-DD, years 0001–9999, with Gregorian calendar validation.
- Standard template fields, exactly:
  record_id,date,site_name,latitude,longitude,parameter,value,unit,notes
  The first eight are required if the standard-fields checkbox is enabled.
  Notes are optional. With standard checks enabled, value must be a finite
  dot-decimal number (scientific notation accepted). Physical plausibility and
  parameter/unit agreement are NOT checked.

WHAT IS CHECKED
- Missing mapped fields and optional standard-field requirements.
- Duplicate record IDs: all occurrences flagged. Comparison ignores case,
  trims leading/trailing whitespace, and collapses repeated ASCII spaces.
  Wildcards are treated literally. Source values are never changed.
- Latitude numeric and between -90 and 90; longitude between -180 and 180.
- Actual calendar dates if date validation is enabled.
- Record column counts match the header.

WHAT IS NOT CHECKED
PASS is not a scientific or regulatory endorsement. It does not establish
location correctness, coordinate reference system, measurement plausibility,
unit consistency, sampling quality, data completeness against an external
inventory, or compliance. Swapped coordinates can both be within valid ranges.
The app performs no lookups, reverse-geocoding, automatic repairs or deletion.
It is a beta: review results before operational use. Owner-reported manual browser validation is recorded in
CURRENT_VALIDATION_STATUS.txt; QA_REPORT.txt preserves earlier test evidence.

PRIVACY AND EXPORTS
All data processing happens in the page in memory. There are no external fonts,
libraries, analytics, network calls, cookies or browser-storage writes. A
Content-Security-Policy also blocks network connections. Closing or reloading
loses loaded data. Browser extensions or your operating system are outside the
app's control. The source file is never overwritten.

The downloadable QA report contains record numbers, IDs, status and issue text,
not the original full dataset. ID text is preserved before export hardening. Record numbers exclude the header and skipped
blank records; multiline CSV fields make these different from physical lines.
Export uses quoted UTF-8 CSV with a BOM. Fields that could be spreadsheet
formulas are prefixed with an apostrophe; this is deliberate text hardening.
Do not remove that prefix when opening untrusted IDs in spreadsheets.

FILES
field-data-check.html — complete user application
sample_field_data.csv — three synthetic records expected to pass
sample_field_data_with_issues.csv — four synthetic records; one passes,
  three need review with all standard checks enabled
developer/ — maintainable source, builder and unit/DOM tests
QA_REPORT.txt — validation performed and remaining release checks

No commercial licence, refund policy, support contract or seller identity is
set by this beta package. Finalize those separately before selling. The sample
names, values and observations are synthetic and not SIAPESQ/client data.
