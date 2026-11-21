import React, { useMemo, useState } from 'react';
import {
  Edit2,
  GitBranch,
  Plus,
  Search,
  Table2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { StudentBSTNode, StudentRecord } from '../../types/unitrack';
import { MAX_STUDENTS } from '../../utils/dataStructures';

interface StudentsViewProps {
  studentRoot: StudentBSTNode | null;
  studentsList: StudentRecord[];
  studentCount: number;
  bstHeight: number;
  onAddStudent: (record: StudentRecord) => { ok: boolean; error?: string; path?: number[] };
  onSearchStudent: (id: number) => { student: StudentRecord | null; path: number[] };
  onUpdateStudent: (
    id: number,
    updates: Omit<StudentRecord, 'id'>
  ) => { ok: boolean; error?: string };
  onDeleteStudent: (id: number) => { ok: boolean };
}

interface PositionedNode {
  node: StudentBSTNode;
  x: number;
  y: number;
  parentX: number | null;
  parentY: number | null;
  branch?: 'L' | 'R';
}

function layoutBST(root: StudentBSTNode | null): {
  nodes: PositionedNode[];
  width: number;
  height: number;
} {
  if (!root) return { nodes: [], width: 640, height: 240 };

  let inorderIndex = 0;
  let maxDepth = 0;
  const rawNodes: Array<{
    node: StudentBSTNode;
    col: number;
    depth: number;
    parentId: number | null;
    branch?: 'L' | 'R';
  }> = [];

  function traverse(
    curr: StudentBSTNode | null,
    depth: number,
    parentId: number | null,
    branch?: 'L' | 'R'
  ) {
    if (!curr) return;
    traverse(curr.left, depth + 1, curr.id, 'L');
    const col = inorderIndex++;
    if (depth > maxDepth) maxDepth = depth;
    rawNodes.push({ node: curr, col, depth, parentId, branch });
    traverse(curr.right, depth + 1, curr.id, 'R');
  }

  traverse(root, 0, null);

  const colSpacing = 88;
  const rowSpacing = 86;
  const padX = 56;
  const padY = 48;

  const coordMap = new Map<number, { x: number; y: number }>();
  for (const item of rawNodes) {
    coordMap.set(item.node.id, {
      x: padX + item.col * colSpacing,
      y: padY + item.depth * rowSpacing,
    });
  }

  const positioned: PositionedNode[] = rawNodes.map((item) => {
    const pos = coordMap.get(item.node.id)!;
    const parentPos = item.parentId !== null ? coordMap.get(item.parentId) ?? null : null;
    return {
      node: item.node,
      x: pos.x,
      y: pos.y,
      parentX: parentPos ? parentPos.x : null,
      parentY: parentPos ? parentPos.y : null,
      branch: item.branch,
    };
  });

  const width = Math.max(640, padX * 2 + Math.max(0, inorderIndex - 1) * colSpacing);
  const height = Math.max(260, padY * 2 + maxDepth * rowSpacing);

  return { nodes: positioned, width, height };
}

export function StudentsView({
  studentRoot,
  studentsList,
  studentCount,
  bstHeight,
  onAddStudent,
  onSearchStudent,
  onUpdateStudent,
  onDeleteStudent,
}: StudentsViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'tree'>('split');
  const [filterText, setFilterText] = useState('');
  const [bstLookupId, setBstLookupId] = useState('');
  const [highlightedPath, setHighlightedPath] = useState<number[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  // Modal state for Add / Edit
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('CSE');
  const [formPhone, setFormPhone] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredStudents = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return studentsList;
    return studentsList.filter(
      (s) =>
        String(s.id).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [studentsList, filterText]);

  const treeLayout = useMemo(() => layoutBST(studentRoot), [studentRoot]);

  const selectedStudent = useMemo(
    () => studentsList.find((s) => s.id === selectedStudentId) ?? null,
    [studentsList, selectedStudentId]
  );

  const openAddModal = () => {
    setFormId('');
    setFormName('');
    setFormDept('CSE');
    setFormPhone('');
    setModalMode('add');
  };

  const openEditModal = (student: StudentRecord) => {
    setFormId(String(student.id));
    setFormName(student.name);
    setFormDept(student.department);
    setFormPhone(student.phone);
    setModalMode('edit');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericId = Number(formId.trim());
    if (modalMode === 'add') {
      const res = onAddStudent({
        id: numericId,
        name: formName,
        department: formDept,
        phone: formPhone,
      });
      if (res.ok) {
        if (res.path) setHighlightedPath(res.path);
        setSelectedStudentId(numericId);
        setLookupFeedback(`Inserted ID ${numericId} along path: ${res.path?.join(' → ')}`);
        setModalMode('closed');
      }
    } else if (modalMode === 'edit') {
      const res = onUpdateStudent(numericId, {
        name: formName,
        department: formDept,
        phone: formPhone,
      });
      if (res.ok) {
        setModalMode('closed');
      }
    }
  };

  const handleBstSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(bstLookupId.trim());
    if (!Number.isInteger(num) || num <= 0) {
      setLookupFeedback('Enter a positive integer student ID to trace BST search.');
      setHighlightedPath([]);
      return;
    }
    const res = onSearchStudent(num);
    setHighlightedPath(res.path);
    if (res.student) {
      setSelectedStudentId(res.student.id);
      setLookupFeedback(
        `Found ${res.student.name} (${res.student.id}) in ${res.path.length} comparison${
          res.path.length === 1 ? '' : 's'
        }: ${res.path.join(' → ')}`
      );
    } else {
      setSelectedStudentId(null);
      setLookupFeedback(
        res.path.length > 0
          ? `ID ${num} not found. Traversed: ${res.path.join(' → ')} → NULL`
          : `BST is currently empty.`
      );
    }
  };

  const clearTrace = () => {
    setHighlightedPath([]);
    setLookupFeedback(null);
    setBstLookupId('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
            Student Management (BST)
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-mono tabular-nums">
              {studentCount}/{MAX_STUDENTS} nodes
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Height: {bstHeight}</span>
            <span aria-hidden="true">·</span>
            <span>Avg Search/Insert/Delete O(log n) · Inorder Traversal O(n)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-full glass-subpanel">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'split'
                  ? 'bg-[#4B2CD4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-[#4B2CD4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'tree'
                  ? 'bg-[#4B2CD4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>BST Diagram</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* BST Lookup Trace Bar */}
      <div className="rounded-3xl glass-card-3d p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <form onSubmit={handleBstSearch} className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              value={bstLookupId}
              onChange={(e) => setBstLookupId(e.target.value)}
              placeholder="Trace BST search by Student ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono tabular-nums text-[#1E194B] dark:text-white placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
          >
            Search BST
          </button>
          {(highlightedPath.length > 0 || lookupFeedback) && (
            <button
              type="button"
              onClick={clearTrace}
              className="px-3 py-2 rounded-xl glass-subpanel text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#1E194B] whitespace-nowrap"
            >
              Clear Trace
            </button>
          )}
        </form>

        {lookupFeedback && (
          <p className="text-xs font-mono text-[#4B2CD4] dark:text-violet-200 bg-violet-50/90 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 rounded-xl px-3.5 py-2">
            {lookupFeedback}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          viewMode === 'split' ? 'xl:grid-cols-12' : ''
        }`}
      >
        {/* Directory Table (Inorder Traversal) */}
        {(viewMode === 'split' || viewMode === 'table') && (
          <section
            className={`${
              viewMode === 'split' ? 'xl:col-span-6' : ''
            } rounded-2xl glass-card-3d overflow-hidden flex flex-col`}
          >
            <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Student Directory (Inorder Traversal)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sorted ascending by Student ID
                </p>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter name, ID, phone..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {studentsList.length === 0
                    ? 'Student BST is empty. Add your first student record.'
                    : 'No students match your current filter.'}
                </p>
                {studentsList.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Student</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
                      <th className="py-2.5 px-4">ID</th>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Dept</th>
                      <th className="py-2.5 px-4">Phone</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredStudents.map((s) => {
                      const isSelected = selectedStudentId === s.id;
                      const inPath = highlightedPath.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentId(s.id);
                            const trace = onSearchStudent(s.id);
                            setHighlightedPath(trace.path);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40'
                              : inPath
                                ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">
                            {s.id}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                            {s.name}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {s.department}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {s.phone}
                          </td>
                          <td
                            className="py-2.5 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {confirmDeleteId === s.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteStudent(s.id);
                                    setConfirmDeleteId(null);
                                    if (selectedStudentId === s.id) {
                                      setSelectedStudentId(null);
                                      setHighlightedPath([]);
                                    }
                                  }}
                                  className="px-2 py-1 rounded text-[11px] font-medium bg-rose-600 text-white hover:bg-rose-700"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(s)}
                                  aria-label={`Edit ${s.name}`}
                                  className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(s.id)}
                                  aria-label={`Delete ${s.name}`}
                                  className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Interactive BST SVG Visualizer */}
        {(viewMode === 'split' || viewMode === 'tree') && (
          <section
            className={`${
              viewMode === 'split' ? 'xl:col-span-6' : ''
            } rounded-2xl glass-card-3d overflow-hidden flex flex-col`}
          >
            <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Binary Search Tree Visualizer
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any node to inspect · Left &lt; Parent &lt; Right
                </p>
              </div>
              {highlightedPath.length > 0 && (
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  Path highlighted
                </span>
              )}
            </div>

            <div className="p-4 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40 flex-1 flex flex-col justify-between">
              {treeLayout.nodes.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  Empty BST (`studentRoot = NULL`). Add a student to render nodes.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
                  className="w-full min-w-[520px] h-auto max-h-[420px] select-none"
                  role="img"
                  aria-label="Student Binary Search Tree Diagram"
                >
                  {/* Edges */}
                  {treeLayout.nodes.map((item) => {
                    if (item.parentX === null || item.parentY === null) return null;
                    const isHighlightedEdge =
                      highlightedPath.includes(item.node.id) &&
                      highlightedPath.some(
                        (pid, idx) =>
                          idx < highlightedPath.length - 1 &&
                          highlightedPath[idx + 1] === item.node.id &&
                          pid !== item.node.id
                      );
                    const midX = (item.parentX + item.x) / 2;
                    const midY = (item.parentY + item.y) / 2;
                    return (
                      <g key={`edge-${item.node.id}`}>
                        <line
                          x1={item.parentX}
                          y1={item.parentY}
                          x2={item.x}
                          y2={item.y}
                          className={
                            isHighlightedEdge
                              ? 'stroke-[#4B2CD4] dark:stroke-violet-400'
                              : 'stroke-violet-200 dark:stroke-violet-800'
                          }
                          strokeWidth={isHighlightedEdge ? 2.5 : 1.5}
                        />
                        <text
                          x={midX + (item.branch === 'L' ? -8 : 8)}
                          y={midY - 2}
                          textAnchor="middle"
                          className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                        >
                          {item.branch}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {treeLayout.nodes.map((item) => {
                    const isTarget =
                      selectedStudentId === item.node.id ||
                      (highlightedPath.length > 0 &&
                        highlightedPath[highlightedPath.length - 1] === item.node.id);
                    const isOnPath = highlightedPath.includes(item.node.id);
                    const isRoot = studentRoot?.id === item.node.id;
                    const shortId = String(item.node.id).slice(-4);
                    const firstName = item.node.name.split(' ')[0];

                    return (
                      <g
                        key={`node-${item.node.id}`}
                        onClick={() => {
                          setSelectedStudentId(item.node.id);
                          const trace = onSearchStudent(item.node.id);
                          setHighlightedPath(trace.path);
                          setLookupFeedback(
                            `Selected ${item.node.name} (${item.node.id}) · Path: ${trace.path.join(
                              ' → '
                            )}`
                          );
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={item.x}
                          cy={item.y}
                          r={24}
                          className={
                            isTarget
                              ? 'fill-[#4B2CD4] stroke-[#351BA8] dark:fill-violet-500 dark:stroke-violet-300'
                              : isOnPath
                                ? 'fill-amber-100 stroke-amber-500 dark:fill-amber-950 dark:stroke-amber-400'
                                : 'fill-white stroke-violet-300 dark:fill-slate-900 dark:stroke-violet-700 hover:stroke-[#4B2CD4]'
                          }
                          strokeWidth={isTarget || isOnPath ? 2.5 : 1.75}
                        />
                        {isRoot && (
                          <text
                            x={item.x}
                            y={item.y - 30}
                            textAnchor="middle"
                            className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono font-semibold"
                          >
                            ROOT
                          </text>
                        )}
                        <text
                          x={item.x}
                          y={item.y + 4}
                          textAnchor="middle"
                          className={`text-[11px] font-mono font-semibold ${
                            isTarget
                              ? 'fill-white'
                              : 'fill-slate-900 dark:fill-slate-100'
                          }`}
                        >
                          ..{shortId}
                        </text>
                        <text
                          x={item.x}
                          y={item.y + 39}
                          textAnchor="middle"
                          className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
                        >
                          {firstName}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {selectedStudent && (
                <div className="mt-4 p-4 rounded-xl glass-subpanel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        ID {selectedStudent.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedStudent.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{selectedStudent.phone}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {selectedStudent.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedStudent)}
                      className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteStudent(selectedStudent.id);
                        setSelectedStudentId(null);
                        setHighlightedPath([]);
                      }}
                      className="px-3 py-1.5 rounded-md border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Delete Node
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl glass-card-3d overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {modalMode === 'add' ? 'Add Student to BST' : `Update Student #${formId}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalMode('closed')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Student ID (Positive Integer Key)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  disabled={modalMode === 'edit'}
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. 241311055"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ayesha Siddiqua"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="CSE"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="017XX-XXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('closed')}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d"
                >
                  {modalMode === 'add' ? 'Insert into BST' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
