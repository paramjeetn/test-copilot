import React, { useEffect, useState } from "react";
import fs from 'vite-plugin-fs/browser';

interface RightPanelProps {
  selectedKey: string | null;
  data: any;
  selectedTab: "patient" | "guideline";
}

const RightPanel: React.FC<RightPanelProps> = ({ selectedKey, data, selectedTab }) => {
  const [fileData, setFileData] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false); // For LGTM confirmation
  const [verificationStatus, setVerificationStatus] = useState<any>({});
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false); // Track verification status for modal message
  const [goldenRecommendation, setGoldenRecommendation] = useState<string>(""); // Text content of the recommendation
  const [isEditing, setIsEditing] = useState<boolean>(false); // Control whether the text is editable or not

  // Fetch file content when selectedKey or tab changes
  useEffect(() => {
    if (selectedKey && data[selectedKey]) {
      const fetchFiles = async () => {
        try {
          if (selectedTab === "patient") {
            const { medical_condition_path, recommendation_path, retrieve_result_path } = data[selectedKey];

            const [medical, recommendation, retrieve] = await Promise.all([
              fetchFile(medical_condition_path),   // Fetch medical condition
              fetchFile(recommendation_path),
              fetchFile(retrieve_result_path),
            ]);
             console.log(medical_condition_path)
            setFileData({ medical, recommendation, retrieve });

            // Fetch golden recommendation for the selected patient
            const goldenRecommendationPath = `public/data/output/golden_recommendation/${selectedKey}.txt`;
            try {
              const savedRecommendation = await fs.readFile(goldenRecommendationPath);
              setGoldenRecommendation(savedRecommendation || ""); // Load existing content for display
              setIsEditing(false); // Disable editing initially
            } catch (err) {
              console.log("Golden recommendation file doesn't exist, initializing empty.");
              setGoldenRecommendation(""); // Initialize as empty if the file doesn't exist
              setIsEditing(true); // Enable editing if no file exists
            }

          } else if (selectedTab === "guideline") {
            const { guideline_medical_condition_path, guideline_criteria_path } = data[selectedKey];

            const [medicalCondition, guidelineCriteria] = await Promise.all([
              fetchFile(guideline_medical_condition_path),
              fetchFile(guideline_criteria_path)
            ]);

            setFileData({ medicalCondition, guidelineCriteria });
          }
        } catch (error) {
          console.error("Error loading files:", error);
        }
      };

      fetchFiles();
    }
  }, [selectedKey, data, selectedTab]);

  // Fetch the verification status file (assuming it's stored in JSON format)
  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        const verificationStatusData = await fs.readFile('public/data/output/verificationStatus.json'); // Make sure the path starts with '/' to be relative to the public folder
        setVerificationStatus(JSON.parse(verificationStatusData));
      } catch (error) {
        console.error('Error loading verification status:', error);
      }
    };
    
    loadVerificationStatus();
  }, []);

  // Get the verification status for a specific section
  const getVerificationStatusForPanel = (section: string) => {
    if (selectedKey && verificationStatus) {
      if (selectedTab === "patient") {
        return verificationStatus.patients?.[selectedKey]?.[section] || false;
      } else if (selectedTab === "guideline") {
        return verificationStatus.guidelines?.[selectedKey]?.[section] || false;
      }
    }
    return false; // Default to false if no status is found
  };

  // Handle LGTM button click (open modal)
  const handleLGTMClick = (section: string) => {
    setCurrentSection(section);
    setIsVerified(getVerificationStatusForPanel(section)); // Track current verification status for modal message
    setIsModalOpen(true);
  };

  // Toggle verification status and save it to the file
  const toggleVerificationStatus = async () => {
    try {
      if (!selectedKey || !currentSection) return;
  
      // Clone the current verification status object
      const updatedStatus = { ...verificationStatus };
  
      // Check if we're toggling a patient's status
      if (selectedTab === "patient") {
        if (!updatedStatus.patients[selectedKey]) {
          // Initialize patient entry if it doesn't exist
          updatedStatus.patients[selectedKey] = {
            medical_condition_verified: false,
            recommendation_verified: false,
            retrieved_candidates_verified: false,
          };
        }
        updatedStatus.patients[selectedKey][currentSection] = !getVerificationStatusForPanel(currentSection);
      }
  
      // Check if we're toggling a guideline's status
      else if (selectedTab === "guideline") {
        if (!updatedStatus.guidelines[selectedKey]) {
          // Initialize guideline entry if it doesn't exist
          updatedStatus.guidelines[selectedKey] = {
            guideline_medical_condition_verified: false,
            guideline_criteria_verified: false,
          };
        }
        updatedStatus.guidelines[selectedKey][currentSection] = !getVerificationStatusForPanel(currentSection);
      }
  
      // Update local state to reflect the change
      setVerificationStatus(updatedStatus);
  
      // Save the updated verification status to the JSON file
      const filePath = 'public/data/output/verificationStatus.json';
      await fs.writeFile(filePath, JSON.stringify(updatedStatus, null, 2));
  
      // Close the modal after saving
      setIsModalOpen(false);
  
      console.log('Verification status updated successfully!');
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  };

  // Save the updated golden recommendation to the file when user clicks save
  const handleSaveRecommendation = async () => {
    if (selectedKey) {
      const filePath = `public/data/output/golden_recommendation/${selectedKey}.txt`;
      await fs.writeFile(filePath, goldenRecommendation); // Save the updated text
      setIsEditing(false); // Disable editing after save
    }
  };

  // Close the modal without saving
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const fetchFile = async (filePath: string) => {
    const response = await fetch(filePath);
    if (response.ok) {
      return await response.text();
    } else {
      return "Error loading file";
    }
  };

  return (
    <div className="h-full p-4">
      {selectedTab === "patient" && selectedKey && (
        <div className="h-full flex flex-col justify-between">
          {/* Golden Recommendation */}
          <div className="flex-1 mb-4">
            <h2 className="font-semibold">Golden Recommendation</h2>
            <div className="bg-gray-100 p-2">
              {isEditing ? (
                <textarea
                  className="w-full p-2 border rounded bg-white"
                  value={goldenRecommendation}
                  onChange={(e) => setGoldenRecommendation(e.target.value)}
                />
              ) : (
                <pre>{goldenRecommendation || "No Golden Recommendation yet"}</pre>
              )}

              {/* Show Edit or Save buttons */}
              {isEditing ? (
                <button
                  onClick={handleSaveRecommendation}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          
          {/* Medical Condition */}
          <div className="flex-1 mb-4">
            <div className="flex items-center">
              <h2 className="font-semibold">Medical Condition</h2>
              <button
                onClick={() => handleLGTMClick("medical_condition_verified")}
                className={`ml-4 px-4 py-2 rounded ${getVerificationStatusForPanel("medical_condition_verified") ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'} hover:bg-gray-700`}
              >
                {getVerificationStatusForPanel("medical_condition_verified") ? "LGTM (Verified)" : "LGTM"}
              </button>
            </div>
            <div className="bg-gray-100 p-2 overflow-y-auto max-h-32">
              <pre>{fileData.medical}</pre>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex-1 mb-4">
            <div className="flex items-center">
              <h2 className="font-semibold">Recommendation</h2>
              <button
                onClick={() => handleLGTMClick("recommendation_verified")}
                className={`ml-4 px-4 py-2 rounded ${getVerificationStatusForPanel("recommendation_verified") ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'} hover:bg-gray-700`}
              >
                {getVerificationStatusForPanel("recommendation_verified") ? "LGTM (Verified)" : "LGTM"}
              </button>
            </div>
            <div className="bg-gray-100 p-2 overflow-y-auto max-h-32">
              <pre>{fileData.recommendation}</pre>
            </div>
          </div>

          {/* Retrieved Candidates */}
          <div className="flex-1 mb-4">
            <div className="flex items-center">
              <h2 className="font-semibold">Retrieved Candidates</h2>
              <button
                onClick={() => handleLGTMClick("retrieved_candidates_verified")}
                className={`ml-4 px-4 py-2 rounded ${getVerificationStatusForPanel("retrieved_candidates_verified") ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'} hover:bg-gray-700`}
              >
                {getVerificationStatusForPanel("retrieved_candidates_verified") ? "LGTM (Verified)" : "LGTM"}
              </button>
            </div>
            <div className="bg-gray-100 p-2 overflow-y-auto max-h-32">
              <pre>{fileData.retrieve}</pre>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "guideline" && selectedKey && (
        <div className="h-full flex flex-col justify-between">
          {/* Guideline Medical Condition */}
          <div className="flex-1 mb-4">
            <div className="flex items-center">
              <h2 className="font-semibold">Guideline Medical Condition</h2>
              <button
                onClick={() => handleLGTMClick("guideline_medical_condition_verified")}
                className={`ml-4 px-4 py-2 rounded ${getVerificationStatusForPanel("guideline_medical_condition_verified") ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'} hover:bg-gray-700`}
              >
                {getVerificationStatusForPanel("guideline_medical_condition_verified") ? "LGTM (Verified)" : "LGTM"}
              </button>
            </div>
            <div className="bg-gray-100 p-2 overflow-y-auto max-h-32">
              <pre>{fileData.medicalCondition}</pre>
            </div>
          </div>

          {/* Guideline Criteria */}
          <div className="flex-1 mb-4">
            <div className="flex items-center">
              <h2 className="font-semibold">Guideline Criteria</h2>
              <button
                onClick={() => handleLGTMClick("guideline_criteria_verified")}
                className={`ml-4 px-4 py-2 rounded ${getVerificationStatusForPanel("guideline_criteria_verified") ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'} hover:bg-gray-700`}
              >
                {getVerificationStatusForPanel("guideline_criteria_verified") ? "LGTM (Verified)" : "LGTM"}
              </button>
            </div>
            <div className="bg-gray-100 p-2 overflow-y-auto max-h-32">
              <pre>{fileData.guidelineCriteria || "No Criteria available"}</pre>
            </div>
          </div>

          {/* Main Guideline Path */}
          <div className="flex-1 mb-4">
            <h2 className="font-semibold">Main Guideline Path (PDF)</h2>
            {data[selectedKey]?.main_guideline_path ? (
              <p className="bg-gray-100 p-2">
                <a href={data[selectedKey].main_guideline_path} target="_blank" rel="noopener noreferrer">
                  View PDF
                </a>
              </p>
            ) : (
              <p>No PDF available</p>
            )}
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full z-30">
              <h2 className="text-lg font-semibold mb-4">
                {isVerified ? "Are you sure you want to make it unverified?" : "Are you sure you want to mark it as verified?"}
              </h2>
              <div className="flex justify-end">
                <button
                  onClick={toggleVerificationStatus}
                  className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  OK
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black opacity-50 z-10"></div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
