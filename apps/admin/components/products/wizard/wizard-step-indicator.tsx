"use client";

import { Check } from "lucide-react";
import type { WizardStep } from "@/lib/constants/wizard.constants";

interface WizardStepIndicatorProps {
  steps: readonly WizardStep[];
  currentStep: number;
}

/**
 * Step indicator component for wizard navigation
 * Shows progress through wizard steps with visual indicators
 */
export function WizardStepIndicator({
  steps,
  currentStep,
}: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <StepCircle
              stepId={step.id}
              currentStep={currentStep}
              isCompleted={currentStep > step.id}
            />
            <StepTitle step={step} currentStep={currentStep} />
          </div>
          {index < steps.length - 1 && (
            <StepConnector
              isCompleted={currentStep > step.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface StepCircleProps {
  stepId: number;
  currentStep: number;
  isCompleted: boolean;
}

/**
 * Individual step circle indicator
 */
function StepCircle({ stepId, currentStep, isCompleted }: StepCircleProps) {
  const isActive = currentStep === stepId;
  
  const circleClasses = `w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
    isCompleted
      ? "bg-primary text-primary-foreground border-primary"
      : isActive
        ? "border-primary bg-primary text-primary-foreground"
        : "border-muted bg-background text-muted-foreground"
  }`;

  return (
    <div className={circleClasses}>
      {isCompleted ? (
        <Check className="h-5 w-5" />
      ) : (
        <span className="font-medium">{stepId}</span>
      )}
    </div>
  );
}

interface StepTitleProps {
  step: WizardStep;
  currentStep: number;
}

/**
 * Step title display
 */
function StepTitle({ step, currentStep }: StepTitleProps) {
  const isActiveOrCompleted = currentStep >= step.id;
  
  return (
    <div className="mt-2 text-center">
      <div
        className={`text-xs font-medium ${
          isActiveOrCompleted ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {step.title}
      </div>
    </div>
  );
}

interface StepConnectorProps {
  isCompleted: boolean;
}

/**
 * Connector line between steps
 */
function StepConnector({ isCompleted }: StepConnectorProps) {
  return (
    <div
      className={`h-0.5 flex-1 mx-2 ${
        isCompleted ? "bg-primary" : "bg-muted"
      }`}
    />
  );
}

