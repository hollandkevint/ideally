'use client'

import { useState } from 'react'
import BmadInterface from '@/app/components/bmad/BmadInterface'

export default function TestBmadButtons() {
  const [preservedInput, setPreservedInput] = useState('I have a new app idea for healthcare data management')
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">BMad Button Testing</h1>
          <p className="text-gray-600">
            This page tests the BMad interface buttons without authentication requirements.
          </p>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Simulated Preserved Input:
            </label>
            <input
              type="text"
              value={preservedInput}
              onChange={(e) => setPreservedInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter test input..."
            />
            <button
              onClick={() => setPreservedInput('')}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Clear Input
            </button>
          </div>
        </div>

        <BmadInterface
          workspaceId="test-workspace-id"
          preservedInput={preservedInput}
          onInputConsumed={() => {
            console.log('Input consumed!')
            setPreservedInput('')
          }}
          className="w-full"
        />
      </div>
    </div>
  )
}