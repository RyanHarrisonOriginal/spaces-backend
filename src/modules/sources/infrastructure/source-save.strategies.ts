import { PrismaClient } from '@prisma/client';
import { SaveStrategy } from '../../../shared/domain/repository';
import { Source } from '../domain/source.entity';
import { PrismaSourceMapper } from './prisma-source.mapper';

export type SourceSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaSourceMapper;
  entity: Source;
};

export class UpdateSourceSaveStrategy
  implements SaveStrategy<SourceSaveContext, Source>
{
  async execute({ prisma, mapper, entity }: SourceSaveContext): Promise<Source> {
    const row = await prisma.source.update({
      where: { id: entity.id },
      data: mapper.toUpdateData(entity),
      include: { contentTypes: true },
    });
    return mapper.toDomain(row);
  }
}
