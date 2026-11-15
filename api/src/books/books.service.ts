import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

interface FindAllParams {
  genreId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    await this.ensureGenreExists(dto.genreId);

    try {
      return await this.prisma.book.create({
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll({ genreId, search, page = 1, limit = 10 }: FindAllParams) {
    // Keep page and limit in a safe range
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Build the Prisma "where" clause from the filters that were sent
    const where: Prisma.BookWhereInput = {};

    if (genreId) {
      where.genreId = genreId;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { author: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Run the page query and the total count together
    const [data, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: { title: 'asc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });

    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id); // throws 404 if it does not exist

    if (dto.genreId !== undefined) {
      await this.ensureGenreExists(dto.genreId);
    }

    try {
      return await this.prisma.book.update({
        where: { id },
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id); // throws 404 if it does not exist
    return this.prisma.book.delete({ where: { id } });
  }

  private async ensureGenreExists(genreId: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
    });

    if (!genre) {
      throw new BadRequestException(`Genre with id ${genreId} does not exist`);
    }
  }

  // Turn common database errors into clear HTTP errors
  private handleError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A book with that ISBN already exists');
    }
    throw error;
  }
}
