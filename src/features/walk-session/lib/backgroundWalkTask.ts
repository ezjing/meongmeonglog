import type { LocationObject } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_WALK_TASK } from '@/entities/walk';

import { processWalkLocations } from './walkLocationProcessor';

interface WalkLocationTaskData {
  locations?: LocationObject[];
}

TaskManager.defineTask(BACKGROUND_WALK_TASK, async ({ data, error }) => {
  if (error) return;

  const locations = (data as WalkLocationTaskData | undefined)?.locations;
  if (!locations?.length) return;

  await processWalkLocations(locations);
});
