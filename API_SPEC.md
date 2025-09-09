## Overview

The API is built using FastAPI, SQLModel and SQLite. It is deployed and tested using a docker container running Uvicorn.

A React Native frontend application which authenticates using 3rd parties such as Facebook, Google and Github via OAuth2. For now dont not impliment authentication.

This frontend interacts with the API.

## Database Schema

All models have a id which is an auto-generated UUID, a creation_at and updated_at field.

### Language

The language model represents a language such as english, french of spanish. It has the following fields.

- code (ISO 639 language code)
- name

### Term

A term represents a individual word or phrase. It has a relationship with the language, a term can have 1 language, lanagues can have many terms. A phrase also has a relationship with the type mode, a term has a single type, a type can have many terms.

- term (the word or phrase)
- example (an example sentance)
- type (verb, noun)

### Type

A type represents a type / part of the language which a term is. For example noun, verb, adverb.

### User 

This represents a user, they have a username, email, first name, last name, native language and study langauge. The native and study language are linked in the language model, a user can only have one study and one native langauge.

### Translation

A translation is the combination of two terms which are equivilent to each other. It consists of a study term and a native term. The translation can only have a single translation and a single native term. Also a translation can either be custom or from a catalogue, if it is from a catalogue then it must be connected to the catalogue. If its a custom translation then the user who created it is connected to it. A translation can only have one user who created it.

### Catalogue

A catalogue represents a group of translations which the user can choose to study. A cataloue has many translations in it. It has a description. It is not associated with a language, instead it can contain translations from many languages. 