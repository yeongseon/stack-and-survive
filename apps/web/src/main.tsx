import { createRoot } from 'react-dom/client';
import { projectStatus } from './status';

createRoot(document.getElementById('root')!).render(
  <main><h1>Stack &amp; Survive</h1><p>Your architecture is your defense.</p><p>{projectStatus()}</p></main>,
);
