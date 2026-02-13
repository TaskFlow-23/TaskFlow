import { WorkRequest, Priority, Status, Role, CommentType, User, Comment } from '../types';
import { AUTHORIZED_AGENTS } from '../constants';

const APP_VERSION = 1; // Increment this when schema changes

// Mock Data including the specifically requested January 2026 operational threads
const INITIAL_DATA: WorkRequest[] = [
  {
    id: 'TR-2026-01',
    title: 'Quantum Core Maintenance (Jan 2026)',
    description: 'Periodic stability check for the main frame quantum entanglement core. Initiated in Jan 2026.',
    priority: Priority.HIGH,
    status: Status.OPEN,
    createdDate: '2026-01-05T09:00:00.000Z',
    dueDate: '2026-01-15T17:00:00.000Z',
    lastUpdated: '2026-01-05T09:00:00.000Z',
    assignedAgent: 'AGT-101',
    createdBy: 'SEC_COORD',
    tags: ['Infrastructure', 'Quantum'],
    comments: [],
    isOverdue: true
  },
  {
    id: 'TR-2026-02',
    title: 'Neural Uplink Synchronization',
    description: 'Resolving signal latency issues in the neural bridge between Sector 7 and 9.',
    priority: Priority.MEDIUM,
    status: Status.IN_PROGRESS,
    createdDate: '2026-01-12T14:30:00.000Z',
    dueDate: '2026-01-20T14:30:00.000Z',
    lastUpdated: '2026-01-12T14:30:00.000Z',
    assignedAgent: 'AGT-109',
    createdBy: 'MED_CORP',
    tags: ['Neural', 'Sector-7'],
    comments: [],
    isOverdue: true
  },
  {
    id: 'TR-2026-03',
    title: 'Boreal Shield Calibration',
    description: 'Winter-specific energy shield adjustment to account for thermal variance.',
    priority: Priority.LOW,
    status: Status.BLOCKED,
    createdDate: '2026-01-28T10:00:00.000Z',
    dueDate: '2026-02-05T10:00:00.000Z',
    lastUpdated: '2026-01-28T10:00:00.000Z',
    assignedAgent: 'AGT-110',
    createdBy: 'ENV_TECH',
    tags: ['Shields', 'Thermal'],
    comments: [],
    isOverdue: true
  },
  {
    id: 'TR-001',
    title: 'Cloud Security Audit - VPC Alpha',
    description: 'Quarterly review of IAM permissions and network security groups.',
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAgent: 'AGT-109',
    createdBy: 'SYS_ADMIN',
    tags: ['IT', 'Urgent', 'Security'],
    comments: [],
    isOverdue: true
  },
  {
    id: 'TR-004',
    title: 'Emergency DB Recovery Protocol',
    description: 'Restore corrupted index in production SQL cluster.',
    priority: Priority.CRITICAL,
    status: Status.IN_PROGRESS,
    createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAgent: 'AGT-109',
    createdBy: 'DBA_LEAD',
    tags: ['IT', 'Urgent', 'Database'],
    comments: [],
    isOverdue: false
  },
  {
    id: 'TR-012',
    title: 'VPN Infrastructure Upgrade',
    description: 'Patch legacy gateway vulnerabilities across all nodes.',
    priority: Priority.HIGH,
    status: Status.OPEN,
    createdDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAgent: 'AGT-109',
    createdBy: 'SEC_OPS',
    tags: ['IT', 'Urgent', 'Security'],
    comments: [],
    isOverdue: true
  }
];

// Population of 7 more requests for each agent (70 total new items)
AUTHORIZED_AGENTS.forEach((agentId, aIdx) => {
  for (let i = 1; i <= 7; i++) {
    INITIAL_DATA.push({
      id: `TR-26-${agentId}-${i}`,
      title: `Terminal Protocol: ${agentId} Node Sync (${i}/7)`,
      description: `Tactical operational thread for ${agentId}. Component verification ${i} initiated January 2026. Data integrity scan active.`,
      priority: i % 4 === 0 ? Priority.HIGH : Priority.MEDIUM,
      status: i % 3 === 0 ? Status.BLOCKED : (i % 2 === 0 ? Status.IN_PROGRESS : Status.OPEN),
      createdDate: '2026-01-05T08:00:00.000Z',
      dueDate: '2026-01-12T17:00:00.000Z',
      lastUpdated: '2026-01-05T08:00:00.000Z',
      assignedAgent: agentId,
      createdBy: 'SYS_DAEMON_AUTOGEN',
      tags: ['Jan-2026', 'Auto-Load'],
      comments: [],
      isOverdue: true
    });
  }
});

class ApiService {
  private storageKey = 'taskflow_data';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      this.saveToStorage(INITIAL_DATA);
    }
    this.runEscalationCheck();
  }

  private getFromStorage(): WorkRequest[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    const data = JSON.parse(raw);

    // Version check and migration
    if (!data.version || data.version < APP_VERSION) {
      const migrated = this.migrateData(data);
      this.saveToStorage(migrated);
      return migrated;
    }

    return data.requests || [];
  }

  private saveToStorage(requests: WorkRequest[]): void {
    const data = { version: APP_VERSION, requests };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private migrateData(oldData: any): WorkRequest[] {
    let requests = oldData.requests || oldData;

    // Migration for version < 1: Ensure isOverdue exists
    if (!oldData.version || oldData.version < 1) {
      requests = requests.map((req: WorkRequest) => ({
        ...req,
        isOverdue: req.isOverdue ?? false,
      }));
    }

    // Add future migrations here as needed
    return requests;
  }

  private runEscalationCheck() {
    const requests = this.getFromStorage();
    const today = new Date();
    let changed = false;

    const updated = requests.map(req => {
      const dueDate = new Date(req.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newReq = { ...req };

      if (today > dueDate && req.status !== Status.DONE) {
        if (!newReq.isOverdue) {
          newReq.isOverdue = true;
          changed = true;
        }

        if (diffDays > 3 && newReq.priority !== Priority.CRITICAL) {
          newReq.priority = Priority.CRITICAL;
          newReq.comments = [...newReq.comments, {
            id: `sys-${Date.now()}`,
            author: 'System',
            content: 'Priority escalated automatically: Deadline exceeded established threshold (>3 days). Protocol marked as CRITICAL.',
            timestamp: new Date().toISOString(),
            type: CommentType.SYSTEM_GENERATED
          }];
          changed = true;
        }
      } else if (today <= dueDate && newReq.isOverdue) {
        newReq.isOverdue = false;
        changed = true;
      }
      return newReq;
    });

    if (changed) {
      this.saveToStorage(updated);
    }
  }

  async getWorkRequests(): Promise<WorkRequest[]> {
    this.runEscalationCheck();
    return new Promise((res) => setTimeout(() => res(this.getFromStorage()), 300));
  }

  async createWorkRequest(data: Partial<WorkRequest>, user: User): Promise<WorkRequest> {
    const requests = this.getFromStorage();
    const now = new Date().toISOString();
    const newRequest: WorkRequest = {
      id: `TR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      title: data.title || 'Untitled Protocol',
      description: data.description || '',
      priority: data.priority || Priority.LOW,
      status: Status.OPEN,
      createdDate: now,
      dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: now,
      assignedAgent: data.assignedAgent || null,
      createdBy: data.createdBy || user.name,
      tags: data.tags || [],
      comments: [],
      isOverdue: false,
    };
    const updated = [...requests, newRequest];
    this.saveToStorage(updated);
    return newRequest;
  }

  async updateWorkRequest(id: string, updates: Partial<WorkRequest>, user: User): Promise<WorkRequest> {
    const requests = this.getFromStorage();
    const request = requests.find(r => r.id === id);

    if (!request) throw new Error('Protocol instance not found');

    const isAdmin = user.role === Role.ADMIN;
    const isAssignedToMe = request.assignedAgent === user.name;

    if (!isAdmin && !isAssignedToMe) {
      throw new Error('Access Denied: You can only modify tasks assigned specifically to your agent ID.');
    }

    const targetAgent = updates.assignedAgent !== undefined ? updates.assignedAgent : request.assignedAgent;
    if (updates.status === Status.DONE && targetAgent === null) {
      throw new Error("Operational Failure: Assigned Agent required for resolution status (Done).");
    }

    if (!isAdmin) {
      if (updates.assignedAgent !== undefined && updates.assignedAgent !== request.assignedAgent) {
        throw new Error('Access Denied: Personnel assignment changes restricted to Admin level.');
      }
      if (updates.createdBy !== undefined && updates.createdBy !== request.createdBy) {
        throw new Error('Access Denied: Initialization authorship changes restricted to Admin level.');
      }
      if (updates.dueDate !== undefined && updates.dueDate !== request.dueDate) {
        throw new Error('Access Denied: Deadline modifications restricted to Admin level.');
      }
    }

    const finalUpdates = { ...updates, lastUpdated: new Date().toISOString() };
    if (isAdmin && updates.assignedAgent === '') finalUpdates.assignedAgent = null;

    const updatedRequest = { ...request, ...finalUpdates };

    if (updates.dueDate) {
      const today = new Date();
      const newDueDate = new Date(updates.dueDate);

      updatedRequest.isOverdue = today > newDueDate && updatedRequest.status !== Status.DONE;

      if (updatedRequest.isOverdue !== request.isOverdue) {
        const statusText = updatedRequest.isOverdue 
          ? 'now overdue' 
          : 'no longer overdue (deadline extended)';
        updatedRequest.comments = [...updatedRequest.comments, {
          id: `sys-${Date.now()}`,
          author: 'System',
          content: `Deadline updated → status changed: ${statusText}`,
          timestamp: new Date().toISOString(),
          type: CommentType.SYSTEM_GENERATED
        }];
      }
    }

    if (updates.status && updates.status !== request.status) {
      updatedRequest.comments = [...updatedRequest.comments, {
        id: `sys-${Date.now()}`,
        author: user.name,
        content: `Lifecycle update: ${request.status} → ${updates.status}`,
        timestamp: new Date().toISOString(),
        type: CommentType.STATUS_UPDATE
      }];
    }

    const updatedList = requests.map(r => r.id === id ? updatedRequest : r);
    this.saveToStorage(updatedList);
    return updatedRequest;
  }

  async deleteWorkRequest(id: string, user: User): Promise<void> {
    // Enforce admin-only deletion
    if (user.role !== Role.ADMIN) {
      throw new Error('Access Denied: Only administrators can delete records.');
    }

    const requests = this.getFromStorage();
    const updated = requests.filter(r => r.id !== id);
    this.saveToStorage(updated);
  }

  async addComment(requestId: string, content: string, type: CommentType, user: User): Promise<WorkRequest> {
    const requests = this.getFromStorage();
    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Protocol instance not found');

    const isAdmin = user.role === Role.ADMIN;
    const isAssigned = request.assignedAgent === user.name;
    const isUnassigned = request.assignedAgent === null;

    if (!isAdmin && !isAssigned && !isUnassigned) {
      throw new Error('Access Denied: Thread restricted to assigned personnel.');
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      author: user.name,
      content,
      timestamp: new Date().toISOString(),
      type
    };

    request.comments = [...request.comments, newComment];
    request.lastUpdated = new Date().toISOString();
    this.saveToStorage(requests);
    return request;
  }
}

export const apiService = new ApiService();