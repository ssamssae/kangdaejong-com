// One lazily loaded WebGL viewer is shared by the twenty cards.
const dialog = document.querySelector('#molecule-dialog');
const stage = document.querySelector('#molecule-stage');
const status = document.querySelector('#molecule-status');
const title = document.querySelector('#molecule-title');
const retry = document.querySelector('#molecule-retry');
const image = document.querySelector('#molecule-image');
const controls = [...document.querySelectorAll('[data-view-action]')];
let rendererPromise;
let viewer;
let initialView;
let opener;
let requestId = 0;
let controller;
let previousOverflow;
let ready = false;
let sessionOpen = false;

function loadRenderer() {
  if (window.$3Dmol) return Promise.resolve(window.$3Dmol);
  if (!rendererPromise) {
    rendererPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        rendererPromise = undefined;
        reject(new Error('Renderer could not be loaded'));
      };
      const timer = setTimeout(fail, 15000);
      script.src = '/protein/vendor/3dmol-2.5.5/3Dmol-min.js';
      script.onload = () => {
        clearTimeout(timer);
        if (window.$3Dmol) resolve(window.$3Dmol);
        else fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
  }
  return rendererPromise;
}

function setReady(value) {
  ready = value;
  controls.forEach(button => { button.disabled = !value; });
}

async function openMolecule(button) {
  opener = button;
  const id = ++requestId;
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  const timeout = setTimeout(() => controller?.signal === signal && controller.abort(), 15000);
  if (!dialog.open) {
    sessionOpen = true;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }
  title.textContent = `${button.dataset.name} · ${button.dataset.code}`;
  image.href = `/protein/${button.dataset.molecule}.png`;
  stage.setAttribute('aria-label', `${button.dataset.name} 회전 가능한 분자 모형`);
  stage.setAttribute('aria-busy', 'true');
  status.textContent = '3D 구조를 불러오는 중입니다…';
  retry.hidden = true;
  setReady(false);
  if (viewer) { viewer.removeAllModels(); viewer.render(); }
  try {
    const [library, response] = await Promise.all([
      loadRenderer(),
      fetch(`/protein/structures/${button.dataset.molecule}.sdf`, { signal }),
    ]);
    if (!response.ok) throw new Error('Structure could not be loaded');
    const sdf = await response.text();
    if (id !== requestId || !dialog.open) return;
    if (!viewer) {
      viewer = library.createViewer(stage, { antialias: true, backgroundColor: '#eeede7' });
    }
    viewer.resize();
    viewer.removeAllModels();
    const model = viewer.addModel(sdf, 'sdf');
    if (!model.selectedAtoms({}).length) throw new Error('Empty structure');
    viewer.setStyle({}, { stick: { radius: 0.13, colorscheme: 'Jmol' }, sphere: { scale: 0.30, colorscheme: 'Jmol' } });
    // Restore a consistent orientation instead of inheriting the previous molecule's rotation.
    viewer.setView([0, 0, 0, 0, 0, 0, 0, 1]);
    viewer.zoomTo();
    viewer.zoom(0.70);
    viewer.rotate(8, 'x');
    viewer.rotate(-12, 'y');
    viewer.render();
    initialView = viewer.getView().slice();
    setReady(true);
    status.textContent = '드래그해서 돌려보세요.';
  } catch {
    if (id !== requestId || !dialog.open) return;
    if (viewer) { viewer.removeAllModels(); viewer.render(); }
    status.textContent = '3D 보기를 열지 못했습니다. 다시 시도하거나 정적인 그림을 확인해주세요.';
    retry.hidden = false;
  } finally {
    clearTimeout(timeout);
    if (id === requestId) stage.setAttribute('aria-busy', 'false');
  }
}

function act(action) {
  if (!ready) return;
  if (action === 'reset') viewer.setView(initialView.slice());
  else if (action === 'in') viewer.zoom(1.2);
  else if (action === 'out') viewer.zoom(1 / 1.2);
  else viewer.rotate(action === 'left' || action === 'up' ? -15 : 15, action === 'left' || action === 'right' ? 'y' : 'x');
  viewer.render();
}

document.querySelectorAll('[data-molecule]').forEach(button => button.addEventListener('click', () => openMolecule(button)));
controls.forEach(button => button.addEventListener('click', () => act(button.dataset.viewAction)));
retry.addEventListener('click', () => openMolecule(opener));
function cleanup() {
  if (!sessionOpen) return;
  sessionOpen = false;
  ++requestId;
  controller?.abort();
  setReady(false);
  if (viewer) { viewer.removeAllModels(); viewer.render(); }
  document.body.style.overflow = previousOverflow;
  opener?.focus({ preventScroll: true });
}
function closeViewer() {
  dialog.close();
  cleanup();
}
document.querySelector('.viewer-close').addEventListener('click', closeViewer);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
// The native close event is queued: do not clear a newly reopened viewer.
dialog.addEventListener('close', () => { if (!dialog.open) cleanup(); });
stage.addEventListener('keydown', event => {
  const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', '0': 'reset' }[event.key];
  if (action) { event.preventDefault(); act(action); }
});
new ResizeObserver(() => { if (dialog.open && viewer) viewer.resize(); }).observe(stage);
