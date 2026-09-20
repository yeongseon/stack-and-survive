import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createController } from '../../src/controller';
import { GameResult } from '../../src/GameResult';
import '../../src/style.css';
import '../../src/player-console.css';

const controller = createController({ start: () => () => {} }, undefined, true);
controller.start();
while (!controller.getSnapshot().result) controller.inspectNextTick();
const view = controller.getSnapshot(); controller.destroy();
function Fixture() {
  const [show, setShow] = useState(true);
  return <main className="tycoon-game"><p>ISOLATED AUTOMATED TEST FIXTURE — not ordinary gameplay or AI evidence</p>
    {show ? <GameResult result={view.result!} architecture={view.state.runtime.architecture} report={null} restart={() => setShow(false)} review={() => setShow(false)} /> : <button type="button" onClick={() => setShow(true)}>Show result again</button>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
