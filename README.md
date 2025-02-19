# CSV Parser - CSV to JSON API
CSV Parser is a backend project built with Express.js and PostgreSQL, designed to efficiently process and store large CSV files containing millions of rows. The system provides a robust API to convert CSV data into JSON objects, store them in the database in batches, and retrieve meaningful insights.

## Key Features:
- __CSV to JSON Conversion__ – Parses CSV files where each row represents an object. Nested properties are supported using a dot (.) separator (e.g., name.firstName, name.lastName, age).
- __Efficient Batch Insertions__ – Data is inserted into PostgreSQL in batches for performance optimization. In case of failure, a rollback mechanism ensures data integrity.
- __Dual Parsing Mechanism__ – Supports CSV parsing through both Multer (middleware-based) and a custom Vanilla JS parser, with separate APIs for each.
- __Age Distribution API__ – Provides aggregated statistics on user age distribution for analytical insights.