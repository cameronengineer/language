# Language Learning API

A FastAPI-based REST API for managing language learning terms and translations, built with SQLModel for database operations.

## Features

- **Complete Database Schema** with SQLModel:
  - Languages (ISO 639 codes)
  - Grammatical Types (noun, verb, etc.)
  - Terms with examples
  - Users with native/study language preferences
  - Translations (custom or from catalogues)
  - Translation Catalogues
  
- **RESTful API Endpoints** for all models
- **Automatic database migrations** on startup
- **Docker/Podman containerization**
- **UUID-based primary keys** for all models
- **Timestamp tracking** (created_at, updated_at) for all records
- **Proper foreign key constraints** and relationships

## Database Schema

### Base Model
All models inherit these fields:
- `id`: UUID primary key
- `created_at`: DateTime timestamp
- `updated_at`: DateTime timestamp

### Models

1. **Language**
   - `code`: ISO 639 language code
   - `name`: Language name
   - Relationships: One-to-many with Terms, Users

2. **Type**
   - `name`: Grammatical type (noun, verb, etc.)
   - Relationships: One-to-many with Terms

3. **Term**
   - `term`: The word/phrase
   - `example`: Optional usage example
   - `type_id`: Foreign key to Type
   - `language_id`: Foreign key to Language
   - Relationships: Many-to-one with Language and Type

4. **User**
   - `username`: Unique username
   - `email`: Email address
   - `first_name`, `last_name`: User's name
   - `native_language_id`: FK to Language
   - `study_language_id`: FK to Language
   - Relationships: References to Languages, One-to-many with custom Translations

5. **Translation**
   - `study_term_id`: FK to Term (study language)
   - `native_term_id`: FK to Term (native language)
   - `is_custom`: Boolean flag
   - `catalogue_id`: Optional FK to Catalogue
   - `user_id`: Optional FK to User
   - Validation: Must be either custom OR from catalogue

6. **Catalogue**
   - `description`: Catalogue description
   - Relationships: One-to-many with Translations

## API Endpoints

### Languages
- `GET /languages/` - List all languages
- `GET /languages/{id}` - Get language by ID
- `GET /languages/code/{code}` - Get language by ISO code
- `POST /languages/` - Create new language
- `PUT /languages/{id}` - Update language
- `DELETE /languages/{id}` - Delete language

### Types
- `GET /types/` - List all types
- `GET /types/{id}` - Get type by ID
- `GET /types/name/{name}` - Get type by name
- `POST /types/` - Create new type
- `PUT /types/{id}` - Update type
- `DELETE /types/{id}` - Delete type

### Terms
- `GET /terms/` - List all terms (with optional filtering)
- `GET /terms/{id}` - Get term by ID
- `GET /terms/search/{search_term}` - Search terms
- `POST /terms/` - Create new term
- `PUT /terms/{id}` - Update term
- `DELETE /terms/{id}` - Delete term

### Users
- `GET /users/` - List all users
- `GET /users/{id}` - Get user by ID
- `GET /users/username/{username}` - Get user by username
- `GET /users/email/{email}` - Get user by email
- `POST /users/` - Create new user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Translations
- `GET /translations/` - List all translations
- `GET /translations/{id}` - Get translation by ID
- `GET /translations/terms/{study_term_id}/{native_term_id}` - Get by terms
- `POST /translations/` - Create new translation
- `PUT /translations/{id}` - Update translation
- `DELETE /translations/{id}` - Delete translation

### Catalogues
- `GET /catalogues/` - List all catalogues
- `GET /catalogues/{id}` - Get catalogue by ID
- `GET /catalogues/search/{search_term}` - Search catalogues
- `POST /catalogues/` - Create new catalogue
- `PUT /catalogues/{id}` - Update catalogue
- `DELETE /catalogues/{id}` - Delete catalogue

### Utility Endpoints
- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Running with Docker/Podman

### Build the container:
```bash
cd api
podman build -t language-api .
```

### Run the container:
```bash
podman run -d --name language-api -p 8000:8000 language-api
```

### Check logs:
```bash
podman logs language-api
```

### Stop the container:
```bash
podman stop language-api
```

### Remove the container:
```bash
podman rm language-api
```

## Running Locally (Development)

### Prerequisites:
- Python 3.11+
- Virtual environment recommended

### Install dependencies:
```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run the API:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Tech Stack

- **FastAPI**: Modern web framework for building APIs
- **SQLModel**: SQL databases with Python objects (combines SQLAlchemy + Pydantic)
- **SQLite**: Lightweight database (easily replaceable with PostgreSQL/MySQL)
- **Uvicorn**: ASGI server
- **Docker/Podman**: Containerization

## Project Structure

```
api/
├── models/          # SQLModel database models
├── schemas/         # (Optional) Pydantic schemas for API
├── crud/           # CRUD operations
├── routes/         # API endpoints
├── core/           # Core configuration
├── database.py     # Database setup
├── main.py         # FastAPI app
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Database Relationships

The database implements several important relationships:

1. **Languages ↔ Terms**: One-to-many (a language has many terms)
2. **Types ↔ Terms**: One-to-many (a type has many terms)
3. **Users ↔ Languages**: Two one-to-one relationships (native and study languages)
4. **Users ↔ Translations**: One-to-many (users can create custom translations)
5. **Catalogues ↔ Translations**: One-to-many (catalogues contain translations)
6. **Terms ↔ Translations**: Many-to-many through Translation model

## Validation

The Translation model includes custom validation to ensure data integrity:
- A translation must be EITHER custom (with user_id) OR from a catalogue (with catalogue_id)
- Cannot be both custom and from a catalogue
- Custom translations require a user_id
- Catalogue translations require a catalogue_id

## Future Enhancements

- Authentication and authorization
- User sessions and JWT tokens
- Advanced search and filtering
- Pagination for large datasets
- Rate limiting
- API versioning
- Database migrations with Alembic
- PostgreSQL/MySQL support
- Caching with Redis
- Background tasks with Celery
- WebSocket support for real-time updates