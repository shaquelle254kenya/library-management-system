# Library Management System

A library management system with a NestJS API, Prisma and PostgreSQL. This first stage builds the data layer for the library's book catalog: users with roles, genres, and books.

## Project structure

- `api/prisma/schema.prisma`: the database schema (Role enum, User, Genre, Book)
- `api/prisma/seed.ts`: inserts sample genres and books
- `api/src/prisma/prisma.service.ts`: a NestJS service that connects to the database
- `api/.env.example`: the environment variables the API needs

## Getting started

1. Install dependencies inside the `api` folder:
   ```bash
   cd api
   npm install
   ```
2. Copy `.env.example` to `.env` and put your own PostgreSQL connection string in `DATABASE_URL`. Never commit `.env`.
3. Create the tables in your database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Add the sample data:
   ```bash
   npx prisma db seed
   ```

## Schema Decisions

### Why Book references Genre instead of embedding it

A `Book` stores a `genreId` foreign key that points to a row in the `Genre` table. It does not copy the genre's data inside the book. I chose this for four reasons:

- **One source of truth.** Each genre exists once. If I rename "Sci-Fi" to "Science Fiction", I change one row, and every book shows the new name. If the genre were embedded, I would have to edit every book, and I could easily miss some.
- **Consistency.** Embedded genre text could drift (`"Fantasy"`, `"fantasy"`, `"Fantasy "`) and the same genre would look like three different ones. A foreign key forces every book to point to a real, existing genre, and the database rejects a `genreId` that does not exist.
- **Easy queries both ways.** With a relation I can ask for all books in a genre, or load a book together with its genre, and Prisma gives me fully typed results. Counting books per genre is a simple query on `genreId`.
- **It fits PostgreSQL.** PostgreSQL is a relational database, and relationships between tables are expressed through foreign keys. Embedding is a better fit for document databases like MongoDB, not for tables.

I also added an index on `genreId`, so finding all books in a genre stays fast as the catalogue grows.

### Other decisions

- **Role enum:** `Role` has two values, `PATRON` and `LIBRARIAN`. An enum means the database only accepts those two values, so a typo like `"librarain"` is impossible. New users default to `PATRON`, the safest role.
- **Unique fields:** `User.email`, `Genre.name` and `Book.isbn` are `@unique`, which stops duplicate accounts, duplicate genres and duplicate catalogue entries.
- **Copies:** `Book.copies` counts how many physical copies the library owns, so one book row can represent several copies.
- **Safe seeding:** the seed script uses `upsert`, so running it more than once does not create duplicate rows.
