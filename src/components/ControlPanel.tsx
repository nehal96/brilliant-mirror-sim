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

  // Default to true if controls or showRayPaths is undefined
  const showRayPaths = controls?.showRayPaths ?? true; // Read from controls prop

  return (
    <div className="p-4 border border-dashed border-gray-400 rounded">
      <h2 className="text-xl font-semibold mb-4">Controls</h2>
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
      {/* Add more controls here later */}
    </div>
  );
};

export default ControlPanel;
