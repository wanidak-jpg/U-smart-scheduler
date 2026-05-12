export interface MajorConfig {
  id?: string;
  name: string;
  year: number;
  semester: number;
  batch: string;
  plan: 'Normal' | 'Co-op';
  studentCount: number;
  curriculumYear: number;
  updatedAt?: any;
}

export interface Course {
  code: string;
  title: string;
  type?: 'LECT' | 'LAB';
  classSize?: number;
  curriculumYear?: number;
  source: 'YearPlan' | 'WOK340';
}

export interface Room {
  roomNum: string;
  roomSize: number;
  roomType: string;
}

export type View = 'setup' | 'planner' | 'grid' | 'reports';
