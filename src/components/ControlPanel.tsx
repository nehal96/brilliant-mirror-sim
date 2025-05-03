import React from "react";
import { ControlParams } from "@/lib/types"; // Import ControlParams

interface ControlPanelProps {
  controls: ControlParams | undefined; // Accept controls object
  onControlChange: (newParams: Partial<ControlParams>) => void; // Function to update controls
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  controls,
  onControlChange,
}) => {
  const handleShowRaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onControlChange({ showRayPaths: event.target.checked }); // Call onControlChange
  };

  const handleParallelMirrorsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onControlChange({ showParallelMirrors: event.target.checked }); // Update parallel mirrors flag
  };

  // Default values if controls or specific flags are undefined
  const showRayPaths = controls?.showRayPaths ?? true;
  const showParallelMirrors = controls?.showParallelMirrors ?? false; // Default to false

  return (
    <div className="p-4 border border-dashed border-gray-400 rounded">
      <h2 className="text-xl font-semibold mb-4">Controls</h2>
      <div className="space-y-3">
        {" "}
        {/* Add spacing between controls */}
        {/* Show Ray Paths Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showRayPaths"
            checked={showRayPaths}
            onChange={handleShowRaysChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="showRayPaths" className="text-sm text-gray-700">
            Show Ray Paths
          </label>
        </div>
        {/* Parallel Mirrors Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showParallelMirrors"
            checked={showParallelMirrors}
            onChange={handleParallelMirrorsChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="showParallelMirrors"
            className="text-sm text-gray-700"
          >
            Enable Parallel Mirrors
          </label>
        </div>
      </div>
      {/* Add more controls here later */}
    </div>
  );
};

export default ControlPanel;
