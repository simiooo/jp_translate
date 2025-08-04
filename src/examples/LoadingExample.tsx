import React from 'react';
import { HydrateFallback } from '../components/HydrateFallback';

export default function LoadingExample() {
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loading Component Examples</h1>
      
      {/* Default spinner */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Default Spinner</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <HydrateFallback />
        </div>
      </div>
      
      {/* Different sizes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Different Sizes</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <HydrateFallback size="sm" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Small</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback size="md" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Medium</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback size="lg" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Large</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback size="xl" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Extra Large</span>
          </div>
        </div>
      </div>
      
      {/* Different colors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Different Colors</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center">
            <HydrateFallback color="primary" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Primary</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback color="secondary" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Secondary</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback color="success" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Success</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback color="warning" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Warning</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback color="error" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Error</span>
          </div>
        </div>
      </div>
      
      {/* Different variants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Different Variants</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <HydrateFallback variant="spinner" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Spinner</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback variant="dots" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Dots</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback variant="bars" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Bars</span>
          </div>
          <div className="flex flex-col items-center">
            <HydrateFallback variant="ring" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Ring</span>
          </div>
        </div>
      </div>
      
      {/* Full screen example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Full Screen Loading</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg h-64 relative">
          <p className="text-gray-600 dark:text-gray-400">Content behind full screen loader</p>
          {/* Normally this would be conditionally rendered */}
          <HydrateFallback fullScreen={false} />
        </div>
      </div>
      
      {/* Custom label */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Custom Label</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <HydrateFallback label="Please wait while we process your request..." />
        </div>
      </div>
      
      {/* No label */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No Label</h2>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <HydrateFallback showLabel={false} />
        </div>
      </div>
    </div>
  );
}