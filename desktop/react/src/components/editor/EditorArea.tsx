import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { TabBar } from './TabBar';
import { MonacoEditor } from './MonacoEditor';
import { OnboardingView } from '../onboarding/OnboardingView';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditorAreaProps {
  onCursorChange?: (line: number, column: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EditorArea: React.FC<EditorAreaProps> = ({ onCursorChange }) => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const hasActiveTabs = openTabs.length > 0 && activeTabId !== null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface-0">
      {/* Tab Bar */}
      {hasActiveTabs && <TabBar />}

      {/* Editor or Onboarding Flow */}
      {hasActiveTabs ? (
        <div className="flex-1 min-h-0">
          <MonacoEditor onCursorChange={onCursorChange} />
        </div>
      ) : (
        <OnboardingView />
      )}
    </div>
  );
};
