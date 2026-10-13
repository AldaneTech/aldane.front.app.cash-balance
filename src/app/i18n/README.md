# Languages and formats

`I18nService` owns the selected language (`es` or `en`), updates the document's
`lang` attribute and remembers the last choice for the login screen. Account
preferences are loaded by the layout and saved from the profile through
`GET/PUT /me/preferences`.

`translations.ts` contains both catalogs. Use the `t` pipe for interface text and
named parameters for dynamic sentences. Never translate user-provided names or
comments. Import `I18nModule` in standalone components that use its pipes.

Use `money`, `localNumber` and `localDate` for display. These use `es-ES` or
`en-GB`, EUR and UTC dates; API payloads retain their original numeric and ISO
formats. Chart month labels use the same locale.

Add matching keys to both languages and cover new preference or formatting
behavior in tests. Existing Spanish source phrases are supported as aliases.
