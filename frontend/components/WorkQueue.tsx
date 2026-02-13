// frontend/components/WorkQueue.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { WorkRequest, Priority, Status } from '../types';
import { AlertTriangle, Filter, Search, ChevronDown, ArrowUpDown } from 'lucide-react';

const WorkQueue = () => {
  const { requests, currentUser, fetchRequests } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchRequests(true);
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(req.status);
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(req.priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-cyan-400">
              PROTOCOL WORK QUEUE
            </h1>
            <p className="text-sm md:text-base text-gray-400 mt-1">
              Real-time linear sequence of all active operational nodes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg
                  text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600
                  text-sm md:text-base
                "
              />
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="
                flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg
                text-cyan-400 hover:bg-gray-800 transition-colors
              "
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Mobile filter toggle panel */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-gray-950 border border-gray-800 rounded-xl md:hidden">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(Status).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setStatusFilter((prev) =>
                          prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s]
                        )
                      }
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        ${statusFilter.includes(s)
                          ? 'bg-cyan-900/70 text-cyan-200 border border-cyan-700'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(Priority).map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setPriorityFilter((prev) =>
                          prev.includes(p) ? prev.filter((v) => v !== p) : [...prev, p]
                        )
                      }
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        ${priorityFilter.includes(p)
                          ? 'bg-cyan-900/70 text-cyan-200 border border-cyan-700'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Queue List - responsive cards */}
      <div className="space-y-4 md:space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No protocols match current filters
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="
                bg-gray-950 border border-gray-800 rounded-xl p-4 md:p-6
                hover:border-cyan-700 transition-colors cursor-pointer
              "
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs md:text-sm font-mono text-cyan-500">
                      {req.id}
                    </span>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium uppercase
                      ${req.priority === Priority.CRITICAL ? 'bg-red-900/60 text-red-300' :
                        req.priority === Priority.HIGH ? 'bg-orange-900/60 text-orange-300' :
                        req.priority === Priority.MEDIUM ? 'bg-yellow-900/60 text-yellow-300' :
                        'bg-green-900/60 text-green-300'}
                    `}>
                      {req.priority}
                    </span>
                    {req.isOverdue && (
                      <span className="px-3 py-1 rounded-full text-xs bg-red-900/70 text-red-200">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-white mb-1">
                    {req.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  <span className="text-sm font-medium text-cyan-300">
                    {req.assignedAgent || 'Unassigned'}
                  </span>

                  <span className={`
                    px-4 py-2 rounded-lg text-xs md:text-sm font-medium uppercase
                    ${req.status === Status.OPEN ? 'bg-blue-900/60 text-blue-300' :
                      req.status === Status.IN_PROGRESS ? 'bg-yellow-900/60 text-yellow-300' :
                      req.status === Status.BLOCKED ? 'bg-red-900/60 text-red-300' :
                      'bg-green-900/60 text-green-300'}
                  `}>
                    {req.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkQueue;