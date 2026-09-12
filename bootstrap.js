// Deferred scripts run in document order. Do not start animation from runner.js:
// its first frame may otherwise run before district.js finishes loading.
(() => {
  const status = document.getElementById('bootStatus');
  const reload = document.getElementById('reloadGame');
  let frameId = null;
  let failed = false;
  reload.addEventListener('click', () => window.location.reload());

  function fail(error) {
    failed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    document.getElementById('bootTitle').textContent = 'The district could not load.';
    document.getElementById('bootMessage').textContent = 'Reload to try again. If you moved the game, keep all its files together in the same folder.';
    reload.classList.remove('hidden');
    status.classList.remove('hidden');
    console.error('AJ RUNNER stopped:', error);
    reload.focus();
  }

  function frame(time) {
    if (failed) return;
    try {
      render(time);
      frameId = requestAnimationFrame(frame);
    } catch (error) {
      fail(error);
    }
  }

  try {
    if (typeof render !== 'function' || typeof drawBackground !== 'function' ||
        typeof drawAJ !== 'function' || typeof updateBonuses !== 'function' ||
        !document.getElementById('bonus-shield')) {
      throw new Error('A required game file did not finish loading.');
    }
    if (!ctx) throw new Error('Canvas rendering is unavailable in this browser.');
    fitCanvas();
    updateHud();
    render(performance.now());
    status.classList.add('hidden');
    frameId = requestAnimationFrame(frame);
  } catch (error) {
    fail(error);
  }
})();
