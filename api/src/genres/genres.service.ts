import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({ data: dto });
    } catch (error) {
      this.handleError(error);
    }
  }

  findAll() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });

    if (!genre) {
      throw new NotFoundException(`Genre with id ${id} not found`);
    }

    return genre;
  }

  async update(id: number, dto: UpdateGenreDto) {
    await this.findOne(id); // throws 404 if it does not exist

    try {
      return await this.prisma.genre.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id); // throws 404 if it does not exist

    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Turn common database errors into clear HTTP errors
  private handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A genre with that name already exists');
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'This genre still has books. Move or delete them first.',
        );
      }
    }
    throw error;
  }
}
