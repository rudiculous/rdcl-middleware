# rdcl-middelware

A collection of middleware and utility functions for Express JS.

# assets

The asset pipeline provides an easy way to serve assets from your
Express application. It can run in one of two settings: `development` or
`production`.

## development

When in development, the asset pipeline expects an extended manifest,
that describes what assets are available and how the assets should be
built. The assets are built the first time they are requested and are
then kept in memory.

## production

When in production, the assets should have already been generated. When
generating the assets (using the assets-task provided), a manifest.json
file is created. This file contains information on which assets have
been created and where they are stored.

In production mode, assets should not be served by Express, so the serve
function throws an error if called in production.

# TemplateLoader

By default, swig uses only relative paths. This template loader extends
the default swig template loader to allow the usage of absolute paths
within the template folder.

# Logger

A custom logger that:
* prepends all logs with a date and the log level;
* allows you to set the log level so that certain messages are not
  shown.

# utilities

Utility functions. There might be better implementations of these, and
if so you are encouraged to use those.

<!-- vim: set tw=72: -->
