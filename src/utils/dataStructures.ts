import {
  ActivityEntry,
  CircularQueueState,
  RegistrationItem,
  StudentBSTNode,
  StudentRecord,
} from '../types/unitrack';

export const MAX_STUDENTS = 200;
export const MAX_QUEUE = 100;
export const MAX_ACTIVITY = 100;
export const MAX_ROUTINE = 200;
export const MAX_TASKS = 100;
export const MAX_EVENTS = 100;
export const MAX_RESULTS = 300;

// ==================== Student Binary Search Tree (BST) ====================

export function cloneBST(root: StudentBSTNode | null): StudentBSTNode | null {
  if (!root) return null;
  return {
    id: root.id,
    name: root.name,
    department: root.department,
    phone: root.phone,
    left: cloneBST(root.left),
    right: cloneBST(root.right),
  };
}

export function findStudentInBST(
  root: StudentBSTNode | null,
  id: number
): { student: StudentRecord | null; path: number[] } {
  const path: number[] = [];
  let current = root;
  while (current !== null) {
    path.push(current.id);
    if (current.id === id) {
      return {
        student: {
          id: current.id,
          name: current.name,
          department: current.department,
          phone: current.phone,
        },
        path,
      };
    }
    current = id < current.id ? current.left : current.right;
  }
  return { student: null, path };
}

export function insertStudentIntoBST(
  root: StudentBSTNode | null,
  record: StudentRecord
): { root: StudentBSTNode; path: number[] } {
  const newNode: StudentBSTNode = {
    ...record,
    left: null,
    right: null,
  };
  if (root === null) {
    return { root: newNode, path: [record.id] };
  }

  const clonedRoot = cloneBST(root)!;
  const path: number[] = [];
  let current: StudentBSTNode = clonedRoot;

  while (true) {
    path.push(current.id);
    if (record.id < current.id) {
      if (current.left === null) {
        current.left = newNode;
        path.push(record.id);
        break;
      }
      current = current.left;
    } else if (record.id > current.id) {
      if (current.right === null) {
        current.right = newNode;
        path.push(record.id);
        break;
      }
      current = current.right;
    } else {
      break;
    }
  }

  return { root: clonedRoot, path };
}

export function updateStudentInBST(
  root: StudentBSTNode | null,
  id: number,
  updates: Omit<StudentRecord, 'id'>
): { root: StudentBSTNode | null; updated: boolean } {
  if (!root) return { root: null, updated: false };
  const cloned = cloneBST(root)!;
  let current: StudentBSTNode | null = cloned;
  while (current) {
    if (current.id === id) {
      current.name = updates.name;
      current.department = updates.department;
      current.phone = updates.phone;
      return { root: cloned, updated: true };
    }
    current = id < current.id ? current.left : current.right;
  }
  return { root, updated: false };
}

function minimumStudentNode(node: StudentBSTNode): StudentBSTNode {
  let current = node;
  while (current.left !== null) {
    current = current.left;
  }
  return current;
}

function deleteNodeRecursive(
  node: StudentBSTNode | null,
  id: number,
  state: { deleted: boolean }
): StudentBSTNode | null {
  if (node === null) return null;

  if (id < node.id) {
    return { ...node, left: deleteNodeRecursive(node.left, id, state) };
  }
  if (id > node.id) {
    return { ...node, right: deleteNodeRecursive(node.right, id, state) };
  }

  state.deleted = true;
  if (node.left === null) return node.right;
  if (node.right === null) return node.left;

  const successor = minimumStudentNode(node.right);
  const ignored = { deleted: false };
  return {
    id: successor.id,
    name: successor.name,
    department: successor.department,
    phone: successor.phone,
    left: node.left,
    right: deleteNodeRecursive(node.right, successor.id, ignored),
  };
}

export function deleteStudentFromBST(
  root: StudentBSTNode | null,
  id: number
): { root: StudentBSTNode | null; deleted: boolean } {
  const state = { deleted: false };
  const nextRoot = deleteNodeRecursive(cloneBST(root), id, state);
  return { root: nextRoot, deleted: state.deleted };
}

export function inorderStudentsBST(root: StudentBSTNode | null): StudentRecord[] {
  const list: StudentRecord[] = [];
  function traverse(node: StudentBSTNode | null) {
    if (!node) return;
    traverse(node.left);
    list.push({
      id: node.id,
      name: node.name,
      department: node.department,
      phone: node.phone,
    });
    traverse(node.right);
  }
  traverse(root);
  return list;
}

export function countStudentsBST(root: StudentBSTNode | null): number {
  if (!root) return 0;
  let count = 0;
  const stack: StudentBSTNode[] = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    count += 1;
    if (current.left) stack.push(current.left);
    if (current.right) stack.push(current.right);
  }
  return count;
}

export function getBSTHeight(root: StudentBSTNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(getBSTHeight(root.left), getBSTHeight(root.right));
}

// ==================== Circular Queue: Registration ====================

export function createCircularQueue(capacity = MAX_QUEUE): CircularQueueState {
  return {
    buffer: Array.from({ length: capacity }, () => null),
    front: 0,
    rear: -1,
    count: 0,
    capacity,
  };
}

export function enqueueCircularQueue(
  queue: CircularQueueState,
  item: RegistrationItem
): { queue: CircularQueueState; error?: string } {
  if (queue.count >= queue.capacity) {
    return { queue, error: 'Registration queue is full (overflow).' };
  }
  const nextRear = (queue.rear + 1) % queue.capacity;
  const nextBuffer = [...queue.buffer];
  nextBuffer[nextRear] = item;
  return {
    queue: {
      ...queue,
      buffer: nextBuffer,
      rear: nextRear,
      count: queue.count + 1,
    },
  };
}

export function dequeueCircularQueue(
  queue: CircularQueueState
): { queue: CircularQueueState; item: RegistrationItem | null; error?: string } {
  if (queue.count === 0) {
    return { queue, item: null, error: 'Registration queue is empty (underflow).' };
  }
  const item = queue.buffer[queue.front];
  const nextBuffer = [...queue.buffer];
  nextBuffer[queue.front] = null;
  const nextFront = (queue.front + 1) % queue.capacity;
  return {
    queue: {
      ...queue,
      buffer: nextBuffer,
      front: nextFront,
      count: queue.count - 1,
    },
    item,
  };
}

export interface OrderedQueueItem {
  queuePosition: number;
  bufferIndex: number;
  item: RegistrationItem;
}

export function getOrderedCircularQueueItems(
  queue: CircularQueueState
): OrderedQueueItem[] {
  const items: OrderedQueueItem[] = [];
  for (let i = 0; i < queue.count; i += 1) {
    const bufferIndex = (queue.front + i) % queue.capacity;
    const entry = queue.buffer[bufferIndex];
    if (entry) {
      items.push({
        queuePosition: i + 1,
        bufferIndex,
        item: entry,
      });
    }
  }
  return items;
}

// ==================== Activity History Stack ====================

export function pushActivityStack(
  stack: ActivityEntry[],
  entry: ActivityEntry,
  maxSize = MAX_ACTIVITY
): ActivityEntry[] {
  const next = [...stack];
  if (next.length >= maxSize) {
    // Shift older entries left to preserve newest activities
    next.shift();
  }
  next.push(entry);
  return next;
}

export function popActivityStack(
  stack: ActivityEntry[]
): { stack: ActivityEntry[]; popped: ActivityEntry | null } {
  if (stack.length === 0) {
    return { stack, popped: null };
  }
  const next = [...stack];
  const popped = next.pop() ?? null;
  return { stack: next, popped };
}
