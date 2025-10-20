import { Group as DomainGroup } from '../core/group.ts';
import { PrismaClient, Group as PrismaGroup } from '../../prisma/generated/client.ts';

export class GroupRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findOrCreate(args: { name: string; color: string }): Promise<PrismaGroup> {
    const existingGroup = await this.prismaClient.group.findUnique({
      where: { name: args.name },
    });


    if (existingGroup) {
      return existingGroup;
    }


    const newGroup = await this.prismaClient.group.create({
      data: {
        name: args.name,
        color: args.color,
      },
    });

    return newGroup;
  }

  async exists(groupId: number): Promise<boolean> {
    const group = await this.prismaClient.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
    return group !== null;
  }

  async getByName(name: string): Promise<DomainGroup | null> {
    const raw = await this.prismaClient.group.findFirst({
      where: { name },
      // To map to the domain object correctly, you MUST include related schemas
      include: { Schemas: true },
    });
    return this.mapToDomain(raw);
  }

  private mapToDomain(raw: (PrismaGroup & { Schemas: any[] }) | null): DomainGroup | null {
    if (!raw) {
      return null;
    }


    return new DomainGroup(
      raw.id,
      raw.name,
      raw.createdAt,
      raw.updatedAt,
      raw.color,
      raw.Schemas ?? [],
    );
  }
}