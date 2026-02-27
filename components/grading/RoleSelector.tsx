'use client';

import React from 'react';
import { FiShield, FiUser, FiUsers } from 'react-icons/fi';
import type { UserRole } from './types';

interface RoleSelectorProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'admin', label: 'Administrator', icon: <FiShield className="w-5 h-5" />, desc: 'System oversight & analytics' },
  { value: 'teacher', label: 'Teacher', icon: <FiUsers className="w-5 h-5" />, desc: 'Create assignments & grade' },
  { value: 'student', label: 'Student', icon: <FiUser className="w-5 h-5" />, desc: 'Submit & view results' },
];

export default function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => onRoleChange(r.value)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${role === r.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
        >
          {r.icon}
          <div className="text-left">
            <div className="font-semibold">{r.label}</div>
            <div className={`text-xs ${role === r.value ? 'text-indigo-100' : 'text-slate-400'}`}>{r.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
