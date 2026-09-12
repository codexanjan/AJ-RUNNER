const bonusLabels = [
  ['shield', 'Shield'], ['magnet', 'Magnet'], ['double', 'Double score'], ['combo', 'Streak']
];
for (const [id, label] of bonusLabels) {
  const badge = document.createElement('div');
  badge.className = 'bonus hidden';
  badge.id = 'bonus-' + id;
  const name = document.createElement('span');
  name.textContent = label;
  const value = document.createElement('strong');
  badge.append(name, value);
  $('bonusStrip').append(badge);
}

function updateBonuses() {
  const values = [shieldTime, magnetTime, state.doubleTime, state.streak];
  bonusLabels.forEach(([id], index) => {
    const badge = $('bonus-' + id);
    if (!badge) return;
    badge.classList.toggle('hidden', values[index] <= 0);
    badge.lastElementChild.textContent = id === 'combo'
      ? state.streak + ' coins / ' + scoreMultiplier() + 'x'
      : Math.ceil(values[index]) + 's';
  });
  $('boardButton').disabled = state.mode !== 'playing' || state.boardUsed;
  $('boardButton').classList.toggle('active', state.boardTime > 0);
  $('boardLabel').textContent = state.boardTime > 0 ? 'Riding' : 'Board';
  $('boardHint').textContent = state.boardTime > 0 ? Math.ceil(state.boardTime) + 's remaining' : state.boardUsed ? 'Used this run' : '1 available';
}

function activateBoard() {
  if (state.mode !== 'playing' || state.boardUsed) return;
  state.boardUsed = true;
  state.boardTime = 10;
  burst(aj.lane, '#9bf8ee');
  toast('RESCUE BOARD / ONE CRASH COVERED');
  beep(410, .12);
  updateBonuses();
}

let guideOrigin = null;
function showGuide() {
  guideOrigin = document.activeElement;
  $('guideScreen').classList.remove('hidden');
  $('startScreen').inert = true;
  $('guidePlay').focus();
}
function closeGuide() {
  $('guideScreen').classList.add('hidden');
  $('startScreen').inert = false;
  if (guideOrigin) guideOrigin.focus();
}
function startFromMenu() {
  let learned = false;
  try { learned = localStorage.getItem('aj-runner-guide-seen') === 'yes'; } catch {}
  if (learned) resetGame(); else showGuide();
}
$('playButton').addEventListener('click', startFromMenu);
$('helpButton').addEventListener('click', showGuide);
$('guideClose').addEventListener('click', closeGuide);
$('guidePlay').addEventListener('click', () => {
  try { localStorage.setItem('aj-runner-guide-seen', 'yes'); } catch {}
  closeGuide();
  resetGame();
});
$('boardButton').addEventListener('click', activateBoard);
window.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'b' && !event.repeat) activateBoard();
  const dialog = Array.from(document.querySelectorAll('.dialog')).find(el => !el.classList.contains('hidden'));
  if (!dialog) return;
  if (event.key === 'Escape' && dialog.id === 'guideScreen') closeGuide();
  if (event.key === 'Tab') {
    const buttons = Array.from(dialog.querySelectorAll('button:not([disabled])'));
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
updateBonuses();
