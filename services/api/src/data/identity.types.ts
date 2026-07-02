export interface StudentProfileRecord {
  gradeLevel: number;
  id: string;
  userId: string;
}

export interface TeacherProfileRecord {
  displayName: string;
  id: string;
  userId: string;
}

export interface ClassRecord {
  gradeLevel: number;
  id: string;
  name: string;
  status: "active" | "archived";
  teacherProfileId: string;
}

export interface ClassRosterStudentRecord {
  displayName: string;
  gradeLevel: number;
  studentProfileId: string;
}

export interface ParentLinkedStudentRecord {
  displayName: string;
  gradeLevel: number;
  relationshipLabel: string;
  studentProfileId: string;
}
