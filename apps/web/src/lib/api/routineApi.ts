import restClient from '../restClient';

export interface RoutineTaskData {
  id: number;
  userId: number;
  title: string;
  displayOrder: number;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RoutineReportData {
  weeklyCompletion: Record<string, number>;
  weeklyAverage: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: string;
}

export const routineApi = {
  list: async () => (await restClient.get<RoutineTaskData[]>('/api/routines')).data,
  create: async (title: string, displayOrder = 0) => 
    (await restClient.post<RoutineTaskData>('/api/routines', { title, displayOrder })).data,
  update: async (id: number, title: string, displayOrder = 0) => 
    (await restClient.put<RoutineTaskData>(`/api/routines/${id}`, { title, displayOrder })).data,
  toggle: async (id: number) => 
    (await restClient.put<{ completed: boolean }>(`/api/routines/${id}/toggle`, {})).data,
  delete: async (id: number) => 
    (await restClient.delete(`/api/routines/${id}`)).data,
  reports: async () => (await restClient.get<RoutineReportData>('/api/routines/reports')).data,
};
