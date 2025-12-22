import React, { useState } from "react";
import {
  ShippingContent,
  SizeChartContent,
  WashingContent,
} from "./InfoContent";

export type InfoTab = "size" | "shipping" | "washing";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: InfoTab;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "size",
}) => {
  const [activeTab, setActiveTab] = useState<InfoTab>(defaultTab);

  // Update active tab when modal opens with a new default
  React.useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const tabs: { id: InfoTab; label: string; icon: string }[] = [
    { id: "size", label: "Size Chart", icon: "straighten" },
    { id: "shipping", label: "Shipping", icon: "local_shipping" },
    { id: "washing", label: "Care", icon: "local_laundry_service" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col shadow-2xl animate-[pop-in_0.3s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold uppercase tracking-tight">
            Product Information
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2
                                ${
                                  activeTab === tab.id
                                    ? "bg-white text-primary border-b-2 border-primary"
                                    : "bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100"
                                }`}
            >
              <span className="material-icons text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === "size" && <SizeChartContent />}
          {activeTab === "shipping" && <ShippingContent />}
          {activeTab === "washing" && <WashingContent />}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="bg-black text-white px-8 py-2 rounded-lg font-bold uppercase text-xs hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
