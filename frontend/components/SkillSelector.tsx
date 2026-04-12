'use client';

import { SKILL_TAGS, type SkillTag } from '@/lib/constants';
import { useCallback } from 'react';

interface SkillSelectorProps {
  selected: SkillTag[];
  onChange: (skills: SkillTag[]) => void;
  error?: string;
}

export function SkillSelector({ selected, onChange, error }: SkillSelectorProps) {
  const toggleSkill = useCallback(
    (skill: SkillTag) => {
      const next = selected.includes(skill)
        ? selected.filter((s) => s !== skill)
        : [...selected, skill];
      onChange(next);
    },
    [selected, onChange],
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Skills Verified
        <span className="text-red-400 ml-1">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {SKILL_TAGS.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer
                ${
                  isSelected
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-300'
                }
              `}
            >
              {isSelected ? <span className="mr-1">✓</span> : null}
              {skill}
            </button>
          );
        })}
      </div>
      {selected.length > 0 ? (
        <p className="text-xs text-gray-500">
          {selected.length} skill{selected.length > 1 ? 's' : ''} selected
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
