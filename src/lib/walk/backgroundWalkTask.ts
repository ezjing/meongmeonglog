import type { LocationObject } from 'expo-location';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { processWalkLocations } from '@/lib/walk/walkLocationProcessor';

export const BACKGROUND_WALK_TASK = 'meongmeonglog-background-walk';

interface WalkLocationTaskData {
  locations?: LocationObject[];
}

TaskManager.defineTask(BACKGROUND_WALK_TASK, async ({ data, error }) => {
  if (error) return;

  const locations = (data as WalkLocationTaskData | undefined)?.locations;
  if (!locations?.length) return;

  await processWalkLocations(locations);
});

export async function isBackgroundWalkTaskRunning(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_WALK_TASK);
}
