
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Status {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  BLOCKED = 'Blocked',
  DONE = 'Done'
}

export enum Role {
  ADMIN = 'Admin',
  AGENT = 'Agent'
}

export enum CommentType {
  GENERAL = 'General',
  STATUS_UPDATE = 'Status Update',
  SYSTEM_GENERATED = 'System-Generated'
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: CommentType;
}

export interface WorkRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdDate: string;
  dueDate: string;
  lastUpdated: string;
  assignedAgent: string | null;
  createdBy: string;
  tags: string[];
  comments: Comment[];
  isOverdue: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface AppData {
  version: number;           
  requests: WorkRequest[];   
}