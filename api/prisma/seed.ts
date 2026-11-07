import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genreNames = [
  'African Literature',
  'Science Fiction',
  'Technology',
  'History',
  'Fantasy',
];

// Sample data. The ISBNs are made-up placeholders, not real ones.
const books = [
  // African Literature
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: 'SAMPLE-0001', publishedYear: 1958, copies: 3, genre: 'African Literature' },
  { title: 'Weep Not, Child', author: 'Ngugi wa Thiongo', isbn: 'SAMPLE-0002', publishedYear: 1964, copies: 2, genre: 'African Literature' },
  { title: 'Petals of Blood', author: 'Ngugi wa Thiongo', isbn: 'SAMPLE-0003', publishedYear: 1977, copies: 2, genre: 'African Literature' },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', isbn: 'SAMPLE-0004', publishedYear: 2006, copies: 2, genre: 'African Literature' },

  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: 'SAMPLE-0005', publishedYear: 1965, copies: 3, genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: 'SAMPLE-0006', publishedYear: 1969, copies: 1, genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: 'SAMPLE-0007', publishedYear: 1984, copies: 2, genre: 'Science Fiction' },
  { title: 'Binti', author: 'Nnedi Okorafor', isbn: 'SAMPLE-0008', publishedYear: 2015, copies: 2, genre: 'Science Fiction' },

  // Technology
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: 'SAMPLE-0009', publishedYear: 2008, copies: 2, genre: 'Technology' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', isbn: 'SAMPLE-0010', publishedYear: 1999, copies: 2, genre: 'Technology' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: 'SAMPLE-0011', publishedYear: 2017, copies: 1, genre: 'Technology' },
  { title: "You Don't Know JS Yet", author: 'Kyle Simpson', isbn: 'SAMPLE-0012', publishedYear: 2020, copies: 2, genre: 'Technology' },

  // History
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: 'SAMPLE-0013', publishedYear: 2011, copies: 3, genre: 'History' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: 'SAMPLE-0014', publishedYear: 1997, copies: 2, genre: 'History' },
  { title: 'Africa: A Biography of the Continent', author: 'John Reader', isbn: 'SAMPLE-0015', publishedYear: 1998, copies: 1, genre: 'History' },

  // Fantasy
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', isbn: 'SAMPLE-0016', publishedYear: 1937, copies: 3, genre: 'Fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: 'SAMPLE-0017', publishedYear: 1968, copies: 2, genre: 'Fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: 'SAMPLE-0018', publishedYear: 2007, copies: 2, genre: 'Fantasy' },
];

async function main() {
  // Create the genres (upsert means running the seed twice is safe)
  const genreIds: Record<string, number> = {};

  for (const name of genreNames) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreIds[name] = genre.id;
  }

  // Create the books, each linked to its genre through genreId
  for (const book of books) {
    const { genre, ...data } = book;

    await prisma.book.upsert({
      where: { isbn: data.isbn },
      update: {},
      create: { ...data, genreId: genreIds[genre] },
    });
  }

  console.log(`Seeded ${genreNames.length} genres and ${books.length} books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
