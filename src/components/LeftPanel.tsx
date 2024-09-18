import React, { useState, useEffect } from "react";

interface LeftPanelProps {
  data: any;
  onSelect: (key: string) => void; // Pass selected key to App.tsx
  selectedTab: "patient" | "guideline";
  selectedKey: string | null; // Track the selected key in LeftPanel to keep track of state
  setSelectedTab: (tab: "patient" | "guideline") => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ data, onSelect, selectedTab, selectedKey, setSelectedTab }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Log data for debugging
  useEffect(() => {
    console.log("Data in LeftPanel:", data);
  }, [selectedTab, selectedKey, data]);

  // Load the profile or guideline file content based on the selected key
  useEffect(() => {
    if (selectedKey && data[selectedKey]) {
      const filePath = selectedTab === "patient" ? data[selectedKey].patient_profile_file_path : data[selectedKey].guideline_file_path;
      fetchFileContent(filePath);
    }
  }, [selectedKey, selectedTab, data]);

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(filePath);
      const content = await response.text();
      setFileContent(content);
    } catch (error) {
      setFileContent("Error loading file");
    }
  };

  const filteredKeys = Object.keys(data).filter((key) =>
    key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 h-full">
      {/* Tabs for patient and guideline */}
      <div className="border-b mb-4">
        <div className="flex">
          <button
            className={`p-2 w-full text-center ${selectedTab === "patient" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => setSelectedTab("patient")}
          >
            Patient
          </button>
          <button
            className={`p-2 w-full text-center ${selectedTab === "guideline" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => setSelectedTab("guideline")}
          >
            Guideline
          </button>
        </div>
      </div>

      {/* Search bar */}
      <input
        type="text"
        placeholder={`Search ${selectedTab}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      {/* Show the filtered search options */}
      <ul className="overflow-auto max-h-64">
        {filteredKeys.length > 0 ? (
          filteredKeys.map((key) => (
            <li
              key={key}
              className={`cursor-pointer p-2 border-b hover:bg-gray-100 ${selectedKey === key ? "bg-blue-100" : ""}`}
              onClick={() => onSelect(key)} // Update both panels
            >
              {key}
            </li>
          ))
        ) : (
          <li className="p-2">No results found</li>
        )}
      </ul>

      {/* Display the loaded profile or guideline content */}
      <div className="mt-4 h-64 overflow-auto bg-gray-100 p-4">
        <h2 className="font-semibold mb-2">{selectedTab === "patient" ? "Patient Profile" : "Guideline"}</h2>
        <pre>{fileContent}</pre>
      </div>
    </div>
  );
};

export default LeftPanel;
