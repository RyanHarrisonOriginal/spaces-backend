import { JOB_TYPES } from '../../../../packages/types/src';

export { JOB_TYPES };

export class UnretryableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnretryableJobError';
  }
}

export type JobHandler = (job: {
  id: string;
  type: string;
  payload: unknown;
}) => Promise<void>;
