import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  getGatherCollectionJob,
  type GatherJobSnapshot,
} from '../../../../../../packages/queue/src';
import { gatherJobFailureCode } from '../../../../../../packages/types/src';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GetGatherJobQuery } from '../get-gather-job.query';

export type GatherJobStatus = 'queued' | 'active' | 'completed' | 'failed';

export type GatherJobView = {
  jobId: string;
  status: GatherJobStatus;
  errorCode?: 'rate_limit' | 'failed';
};

export class GetGatherJobHandler {
  constructor(
    private readonly collectionAccessService: CollectionAccessService,
    private readonly getJob: (
      jobId: string,
    ) => Promise<GatherJobSnapshot | null> = getGatherCollectionJob,
  ) {}

  async execute(query: GetGatherJobQuery): Promise<GatherJobView> {
    await this.collectionAccessService.requireOwnedCollection(
      query.userId,
      query.collectionId,
    );

    const job = await this.getJob(query.jobId);
    if (!job || job.collectionId !== query.collectionId) {
      throw new NotFoundException('Gather job', query.jobId);
    }

    const status = mapJobState(job.state);
    if (status !== 'failed') {
      return { jobId: job.id, status };
    }

    const errorCode = gatherJobFailureCode(job.failedReason) ?? 'failed';
    return {
      jobId: job.id,
      status,
      errorCode,
    };
  }
}

function mapJobState(state: string): GatherJobStatus {
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  if (state === 'active') return 'active';
  return 'queued';
}
