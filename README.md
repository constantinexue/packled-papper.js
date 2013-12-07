packled-papper.js
=================

A place for sharing articles easily

## Goals

- Using a simple website to share and edit documents.
    - An article: written in markdown, majority is text, but contains some pictures.
    - A gallery: An album for photos, or UI designs. No text paragraph, just images and its titles.
    - Maybe other formats.
- All the documents and its attachments should be well organized.
    - Saved in a single directory, with metadata file.
    - Could be downloaded as a zip package.
- Online editing support, can be exported to PDF. Histories would be keep for some versions.
- No user authorization, there are only logs for small team accountability.

# REST definitions

ref: http://raml.org/docs.html

## REST APIs

```RAML
baseUri: /api
version: v1

/{collection}:
    /{article}:
        /{attachment}:
```

## REST pages

```
/:
    description: Lists the projects.
/view:
    /{collection}:
        /{article}:
            /{attachment}:
/edit:
    /{collection}:
        /{article}:
/help:
```

## A file based structure sample

'+' means this is a directory

'-' menas this is a file

```
+ ProjectName
    - $metadata.json: Define the metadata, such as description, created date, and so on.

    'Articles'
    + mystories.md: Source file
    + java-style.md: History files, optional
        - metadata.json: Metadata file
        - 20130507123548.md
        - 20130507123548.json: diff information
    
    'Codes'
    - java-eclipse-formatter.xml
    
    'Images'
    - ui-design-button.jpg
    - ui-design-menu.jpg
```

## Road Map

### v0.1.0

- Opens a md file and view it with markdown mode, preview mode and HTML mode.
- Saves and save as a file.
- Provides a settings UI to change preference.
- Builds for Windows, MAC and Ubuntu.

### v0.1.1

- Attachments(Images) support.
- Publishes to PDF and its settings.
- Editing with synchronized previewing.
- Spelling check support.
- Histories opened files.
- Multi preview themes support.
- Multi editing themes support.

### v0.1.2

- Supports both ACE and CodeMirror.
- 
