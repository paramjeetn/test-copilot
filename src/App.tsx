import  { useState, useEffect } from "react";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import patientAndGuidelineData from "./preprocess/patientAndGuidelineData.json";

const App = () => {
  const [selectedTab, setSelectedTab] = useState<"patient" | "guideline">("patient");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Handle switching between patient and guideline tabs
  const data = selectedTab === "patient" ? patientAndGuidelineData.patient : patientAndGuidelineData.guideline;

  // Load the first item by default when the tab is switched
  useEffect(() => {
    const firstKey = Object.keys(data)[0];
    setSelectedKey(firstKey);
  }, [selectedTab, data]);

  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <div className="w-1/2 border-r border-gray-300">
        <LeftPanel
          data={data}
          selectedKey={selectedKey} // Pass the selected key to LeftPanel
          onSelect={(key) => setSelectedKey(key)} // Set the selected key on selection
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      </div>

      {/* Right Panel */}
      <div className="w-1/2">
        <RightPanel selectedKey={selectedKey} data={data} selectedTab={selectedTab} />
      </div>
    </div>
  );
};

export default App;