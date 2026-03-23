import { useState } from 'react';
import AlgoLayout from '../components/AlgoLayout';
import LearnWorkspace from '../components/LearnWorkspace';
import VisualizeWorkspace from '../components/VisualizeWorkspace';
import PracticeWorkspace from '../components/PracticeWorkspace';
import CodeWorkspace from '../components/CodeWorkspace';
import VideoWorkspace from '../components/VideoWorkspace';
import ProgressWorkspace from '../components/ProgressWorkspace';

export default function AlgoLab() {
  const [activeMode, setActiveMode] = useState('learn');
  const [currentCode, setCurrentCode] = useState("");

  const renderWorkspace = () => {
    switch (activeMode) {
      case 'learn':
        return <LearnWorkspace />;
      case 'visualize':
        return <VisualizeWorkspace />;
      case 'practice':
        return <PracticeWorkspace />;
      case 'code':
        return <CodeWorkspace onCodeChange={setCurrentCode} />;
      case 'video':
        return <VideoWorkspace />;
      case 'progress':
        return <ProgressWorkspace />;
      default:
        return <LearnWorkspace />;
    }
  };

  return (
    <AlgoLayout activeMode={activeMode} onModeChange={setActiveMode} codeContext={currentCode}>
    <div className="workspace-animation" key={activeMode} style={{ height: '100%' }}>
      {renderWorkspace()}
    </div>
    </AlgoLayout>
  );
}
