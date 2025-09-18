'use client';

import React from 'react';
import { NewIdeaPathway } from '@/lib/bmad/pathways/new-idea-pathway';
import { NEW_IDEA_PHASES } from '@/lib/bmad/templates/new-idea-templates';

interface PhaseProgressProps {
  pathway: NewIdeaPathway;
  currentPhaseIndex: number;
}

export default function PhaseProgress({
  pathway,
  currentPhaseIndex
}: PhaseProgressProps) {
  const getPhaseStatus = (index: number) => {
    if (index < currentPhaseIndex) return 'completed';
    if (index === currentPhaseIndex) return 'active';
    return 'pending';
  };

  const getPhaseIcon = (status: string, phaseId: string) => {
    if (status === 'completed') return '✓';
    if (status === 'active') return '▶';

    switch (phaseId) {
      case 'ideation': return '💡';
      case 'market_exploration': return '🎯';
      case 'concept_refinement': return '🔧';
      case 'positioning': return '🚀';
      default: return '○';
    }
  };

  const totalProgress = Math.round((currentPhaseIndex / NEW_IDEA_PHASES.length) * 100);
  const remainingTime = Math.ceil(pathway.getRemainingTime() / (60 * 1000));

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Overall Progress */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Session Progress</h3>
          <p className="text-sm text-gray-600">
            Phase {currentPhaseIndex + 1} of {NEW_IDEA_PHASES.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600" data-testid="overall-progress">
            {totalProgress}%
          </div>
          <div className="text-sm text-gray-500">
            {remainingTime} min remaining
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {NEW_IDEA_PHASES.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div
              key={phase.id}
              data-testid={`phase-indicator-${index + 1}`}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-300
                ${isActive
                  ? 'border-blue-500 bg-blue-50 active'
                  : isCompleted
                    ? 'border-green-500 bg-green-50 completed'
                    : 'border-gray-200 bg-gray-50 pending'
                }
              `}
            >
              {/* Phase Icon */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2
                ${isActive
                  ? 'bg-blue-500 text-white'
                  : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {getPhaseIcon(status, phase.id)}
              </div>

              {/* Phase Info */}
              <div>
                <div className={`
                  text-sm font-medium mb-1
                  ${isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-600'}
                `}>
                  {phase.name}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {phase.timeAllocation} min
                </div>

                {/* Phase Status */}
                <div className={`
                  text-xs px-2 py-1 rounded-full inline-block
                  ${isActive
                    ? 'bg-blue-100 text-blue-800'
                    : isCompleted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {isActive ? 'In Progress' : isCompleted ? 'Complete' : 'Pending'}
                </div>
              </div>

              {/* Current Phase Indicator */}
              {isActive && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Phase Details */}
      {currentPhaseIndex < NEW_IDEA_PHASES.length && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">
                Current Phase: {NEW_IDEA_PHASES[currentPhaseIndex].name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {NEW_IDEA_PHASES[currentPhaseIndex].description}
              </p>
            </div>
            <div className="text-right text-sm text-blue-600" data-testid="current-phase-time">
              {NEW_IDEA_PHASES[currentPhaseIndex].timeAllocation}:00
            </div>
          </div>
        </div>
      )}

      {/* Time Warnings */}
      {remainingTime <= 5 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm font-medium text-red-800">
              Less than 5 minutes remaining! Consider moving to final phases.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}