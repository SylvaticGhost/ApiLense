import { Group } from '../core/group.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';

export class GroupRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async exists(groupId: number): Promise<boolean> {
    return (await this.getByIdQuery(groupId)) !== null;
  }

  async getByName(name: string): Promise<Group | null> {
    const raw = await this.getByNameQuery(name);
    return this.mapToDomain(raw);
  }

  private async getByIdQuery(groupId: number) {
    return await this.prismaClient.group.findFirst({
      where: { id: groupId },
      select: { id: true },
    });
  }

  private async getByNameQuery(name: string) {
    return await this.prismaClient.group.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  private mapToDomain(raw: any) {
    if (!raw) {
      return null;
    }

    return new Group(
      raw.id,
      raw.name,
      raw.createdAt,
      raw.updatedAt,
      raw.color,
      raw.Schemas,
    );
  }

  async create(name: string, color?: string) {
    return await this.prismaClient.group.create({
      data: { name, color: color ?? '' },
    });
  }

  async getById(id: number): Promise<Group | null> {
    const raw = await this.prismaClient.group.findUnique({
      where: { id },
      include: { Schemas: true },
    });
    return this.mapToDomain(raw);
  }

  async update(id: number, data: { name?: string; color?: string }) {
    return await this.prismaClient.group.update({
      where: { id },
      data: data,
    });
  }

  async deleteById(id: number) {
    return await this.prismaClient.group.delete({ where: { id } });
  }

  async list(skip: number, take: number) {
    return await this.prismaClient.group.findMany({
      skip,
      take,
      orderBy: { id: 'asc' },
    });
  }

}
