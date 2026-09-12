function polygon(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function line(x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function drawBackground() {
  const v = view();
  const running = state.mode === 'playing';
  const pace = running ? state.speed / 18 : 0.18;
  const runBounce = running && !aj.jumping && !reducedMotion ? Math.sin(aj.stride) * Math.min(2.6, pace * 3) : 0;
  const laneBank = running && !reducedMotion ? (aj.targetLane - aj.lane) * 8 : 0;

  ctx.save();
  ctx.translate(-laneBank, runBounce);

  const sky = ctx.createLinearGradient(0, 0, 0, v.horizon * 1.25);
  if (state.scene === 'night') {
    sky.addColorStop(0, '#071721');
    sky.addColorStop(0.58, '#174558');
    sky.addColorStop(1, '#d18468');
  } else {
    sky.addColorStop(0, '#4e9fc0');
    sky.addColorStop(0.55, '#a9d6df');
    sky.addColorStop(1, '#f0d6aa');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, v.w + 40, v.h + 40);

  if (state.scene === 'night') {
    ctx.fillStyle = 'rgba(255,244,194,.75)';
    for (let i = 0; i < 34; i++) {
      const x = (i * 197) % v.w;
      const y = 30 + (i * 71) % Math.max(40, v.horizon - 50);
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
  } else {
    ctx.fillStyle = 'rgba(255,244,203,.92)';
    ctx.beginPath();
    ctx.arc(v.w * .82, v.horizon * .32, Math.max(24, v.w * .026), 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant city silhouette.
  for (let i = 0; i < 28; i++) {
    const bw = Math.max(24, v.w / 24);
    const x = i * (v.w / 27) - bw * .5;
    const bh = 36 + ((i * 53) % 122);
    ctx.fillStyle = state.scene === 'night' ? (i % 2 ? '#183844' : '#244652') : (i % 2 ? '#739393' : '#8ba4a1');
    ctx.fillRect(x, v.horizon - bh, bw, bh);
    ctx.fillStyle = state.scene === 'night' ? '#ffd98988' : '#55787699';
    for (let yy = v.horizon - bh + 10; yy < v.horizon - 5; yy += 17) {
      for (let xx = x + 7; xx < x + bw - 5; xx += 13) ctx.fillRect(xx, yy, 4, 7);
    }
  }

  ctx.fillStyle = state.scene === 'night' ? '#283c42' : '#5f6f6d';
  ctx.fillRect(-20, v.horizon, v.w + 40, v.h - v.horizon + 30);

  // Three distinct track beds, each centered on the same lane coordinates used by gameplay.
  for (let lane = 0; lane < 3; lane++) {
    const far = trackPoint(lane, 4.5);
    const near = trackPoint(lane, -.12);
    const halfNear = v.spacing * .43 * near.p;
    const halfFar = v.spacing * .43 * far.p;
    polygon([
      [far.x - halfFar, far.y], [far.x + halfFar, far.y],
      [near.x + halfNear, near.y], [near.x - halfNear, near.y]
    ], lane === 1 ? '#67706d' : '#5b6562');

    for (const side of [-1, 1]) {
      const railNearX = near.x + side * v.spacing * .22 * near.p;
      const railFarX = far.x + side * v.spacing * .22 * far.p;
      line(railFarX, far.y, railNearX, near.y, '#263437', 7 * near.p);
      line(railFarX, far.y, railNearX, near.y, '#cfd8d5', 2 * near.p);
    }
  }

  // Sleepers move toward the camera to create real forward speed.
  const sleeperOffset = worldDistance % .12;
  for (let z = 4.4 - sleeperOffset; z > -.13; z -= .12) {
    const p = trackPoint(1, z);
    for (let lane = 0; lane < 3; lane++) {
      const pt = trackPoint(lane, z);
      const half = v.spacing * .36 * pt.p;
      line(pt.x - half, pt.y, pt.x + half, pt.y, '#313c3b', 2 + 5 * pt.p);
      line(pt.x - half, pt.y - pt.p * 2, pt.x + half, pt.y - pt.p * 2, '#8f9690', Math.max(1, pt.p));
    }
    if (p.y > v.horizon + 6 && p.p > .18) {
      ctx.fillStyle = state.scene === 'night' ? 'rgba(135,225,210,.12)' : 'rgba(255,231,141,.12)';
      ctx.fillRect(0, p.y, v.w, Math.max(1, p.p * 2));
    }
  }

  // Overhead poles and lamps advance using the same world distance.
  for (let i = 0; i < 9; i++) {
    const z = ((i * .56 - worldDistance) % 5.04 + 5.04) % 5.04;
    const center = trackPoint(1, z);
    const p = center.p;
    const sideX = v.spacing * 1.75 * p;
    const poleHeight = Math.min(v.h * .34, 255) * p;
    for (const side of [-1, 1]) {
      const x = center.x + side * sideX;
      line(x, center.y, x, center.y - poleHeight, '#38504f', 2 + 5 * p);
      line(x, center.y - poleHeight, x - side * v.spacing * .55 * p, center.y - poleHeight, '#38504f', 2 + 3 * p);
      ctx.fillStyle = state.scene === 'night' ? 'rgba(255,224,151,.95)' : 'rgba(255,242,190,.82)';
      ctx.fillRect(x - side * v.spacing * .55 * p - 6 * p, center.y - poleHeight, 12 * p, 4 + 5 * p);
    }
  }

  // Side structures pass close to camera for parallax and speed.
  for (let i = 0; i < 7; i++) {
    const z = ((i * .8 - worldDistance * .83) % 5.6 + 5.6) % 5.6;
    const pt = trackPoint(1, z);
    const p = pt.p;
    for (const side of [-1, 1]) {
      const x = pt.x + side * v.spacing * 2.08 * p;
      ctx.fillStyle = state.scene === 'night' ? '#1d3439' : '#536864';
      ctx.fillRect(x - 16 * p, pt.y - 92 * p, 32 * p, 92 * p);
      ctx.fillStyle = state.scene === 'night' ? '#f7cc74' : '#cfe3d5';
      ctx.fillRect(x - 10 * p, pt.y - 76 * p, 20 * p, 8 * p);
    }
  }

  if (running && state.speed > 10 && !reducedMotion) {
    const streakAlpha = Math.min(.22, (state.speed - 10) * .025);
    for (let i = 0; i < 18; i++) {
      const y = v.horizon + ((i * 83 + worldTime * .55) % (v.h - v.horizon));
      const edge = i % 2 ? 1 : -1;
      const x = edge > 0 ? v.w - ((i * 47) % 100) : (i * 47) % 100;
      line(x, y, x - edge * (30 + state.speed * 3), y + 12, `rgba(225,255,242,${streakAlpha})`, 1.5);
    }
  }
  ctx.restore();
}

function drawObstacle(item) {
  if(item.hit) return;
  const pt = trackPoint(item.lane, item.z);
  const s = scaleForZ(item.z);
  ctx.save();
  ctx.translate(pt.x, pt.y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,23,25,.25)';
  ctx.beginPath();
  ctx.ellipse(5, 3, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (item.kind === 'train') {
    const body = ctx.createLinearGradient(-42, 0, 45, 0);
    body.addColorStop(0, '#88a49f'); body.addColorStop(.45, '#dce5dc'); body.addColorStop(1, '#557570');
    ctx.fillStyle = body;
    roundedRect(-44, -205, 88, 205, 11); ctx.fill();
    ctx.fillStyle = '#1c474c'; roundedRect(-35, -181, 70, 57, 8); ctx.fill();
    line(-27, -174, 23, -137, 'rgba(210,240,235,.55)', 2);
    ctx.fillStyle = '#234b45'; ctx.fillRect(-44, -107, 88, 68);
    ctx.fillStyle = '#fff0a8'; ctx.fillRect(-33, -119, 15, 8); ctx.fillRect(18, -119, 15, 8);
    ctx.fillStyle = '#b9e6dc'; ctx.font = '700 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('AJ CITY LINE', 0, -71);
    ctx.fillStyle = '#152c2c'; ctx.fillRect(-30, -22, 60, 13);
  } else if (item.kind === 'signal') {
    ctx.fillStyle = '#3d5350'; ctx.fillRect(-42, -131, 7, 131); ctx.fillRect(35, -131, 7, 131);
    ctx.fillStyle = '#eac24e'; roundedRect(-48, -139, 96, 39, 4); ctx.fill();
    for (let x = -43; x < 43; x += 24) polygon([[x, -139], [x + 12, -139], [x - 3, -100], [x - 15, -100]], '#303b39');
  } else {
    ctx.fillStyle = '#3c4d49'; ctx.fillRect(-38, -54, 7, 54); ctx.fillRect(31, -54, 7, 54);
    ctx.fillStyle = '#eac24e'; roundedRect(-46, -68, 92, 38, 4); ctx.fill();
    for (let x = -40; x < 42; x += 23) polygon([[x, -68], [x + 11, -68], [x - 3, -30], [x - 14, -30]], '#303b39');
  }
  if(item.z > .08 && item.z < .65) {
    const top = item.kind === 'train' ? -228 : item.kind === 'signal' ? -161 : -91;
    ctx.fillStyle='#f4f9e9'; ctx.font='bold 18px Arial'; ctx.textAlign='center';
    ctx.fillText(item.kind === 'train' ? '\u2194' : item.kind === 'signal' ? '\u2193' : '\u2191',0,top);
  }
  ctx.restore();
}

function drawCoin(coin) {
  const pt = trackPoint(coin.lane, coin.z);
  const s = scaleForZ(coin.z);
  ctx.save();
  ctx.translate(pt.x, pt.y - 52 * s);
  ctx.scale((.18 + Math.abs(Math.cos(coin.spin)) * .82) * s, s);
  ctx.shadowColor = '#ffd54d'; ctx.shadowBlur = 12 * s;
  ctx.fillStyle = '#ffd95f'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#fff0a1'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#805617'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', 0, 1);
  ctx.restore();
}

function drawPickup(pickup) {
  const pt = trackPoint(pickup.lane, pickup.z);
  const s = scaleForZ(pickup.z);
  const bob = Math.sin(worldTime * .006 + pickup.z * 3) * 5;
  ctx.save(); ctx.translate(pt.x, pt.y - (56 + bob) * s); ctx.scale(s, s);
  ctx.shadowColor = pickup.kind === 'shield' ? '#92ffe0' : pickup.kind === 'double' ? '#f3a4de' : '#ff9d65'; ctx.shadowBlur = 18;
  ctx.fillStyle = pickup.kind === 'shield' ? '#a5ffe2' : pickup.kind === 'double' ? '#f3a4de' : '#ffb06b';
  if (pickup.kind === 'shield') polygon([[-16, -18], [16, -18], [13, 7], [0, 21], [-13, 7]], ctx.fillStyle);
  else { ctx.font = '900 30px Arial'; ctx.textAlign = 'center'; ctx.fillText(pickup.kind === 'double' ? '2x' : 'U', 0, 14); }
  ctx.shadowBlur = 0; ctx.fillStyle = '#1b4b45'; ctx.font = '900 16px Arial'; ctx.textAlign = 'center'; ctx.fillText(pickup.kind === 'shield' ? '+' : '', 0, 5);
  ctx.restore();
}

function limb(x1, y1, x2, y2, x3, y3, upper, lower, width1, width2) {
  line(x1, y1, x2, y2, upper, width1);
  line(x2, y2, x3, y3, lower, width2);
}

function drawAJ() {
  const v = view();
  const laneDelta = aj.targetLane - aj.lane;
  const speedRatio = Math.min(1, state.speed / 18);
  const active = state.mode === 'playing';
  const cycle = state.mode === 'ready' ? worldTime * .0022 : aj.stride;
  const stride = Math.sin(cycle);
  const opposing = Math.sin(cycle + Math.PI);
  const lift = active && !aj.jumping && !aj.sliding ? Math.abs(Math.sin(cycle * 2)) * 3.5 : 0;
  const landingCompression = aj.landTimer > 0 ? Math.sin((aj.landTimer / .16) * Math.PI) * 8 : 0;
  const x = laneX(aj.lane);
  const baseY = v.ground - aj.y - lift + landingCompression;
  const size = Math.min(1.08, Math.max(.72, v.h / 820));
  const lean = active ? -.045 - speedRatio * .055 + laneDelta * .085 : -.02;

  ctx.save(); ctx.translate(x, v.ground + 6);
  ctx.fillStyle = 'rgba(7,23,25,.34)'; ctx.beginPath();
  ctx.ellipse(0, 0, (30 + Math.abs(stride) * 5) * size, 9 * size, laneDelta * .1, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  ctx.save(); ctx.translate(x, baseY); ctx.scale(size, size); ctx.rotate(lean);
  if(state.boardTime>0){
    ctx.save();ctx.translate(0,8);ctx.rotate(Math.sin(cycle*.4)*.05);ctx.shadowColor='#79f5e2';ctx.shadowBlur=17;
    ctx.fillStyle='#78e4d6';roundedRect(-46,-4,92,12,6);ctx.fill();ctx.shadowBlur=0;line(-27,1,27,1,'#243e4f',3);ctx.restore();
  }
  if (aj.sliding) { ctx.translate(5, -2); ctx.rotate(-.54); ctx.scale(1.08, .72); }

  if (shieldTime > 0) {
    const pulse = 1 + Math.sin(worldTime * .012) * .035;
    ctx.save(); ctx.scale(pulse, pulse); ctx.strokeStyle = 'rgba(145,255,224,.9)'; ctx.lineWidth = 3; ctx.shadowColor = '#8affe0'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(0, -91, 52, 102, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  // Arms counter-swing with legs; elbows bend through the run cycle.
  const armSwing = active ? stride * 22 : 3;
  limb(-22, -132, -33, -105 - armSwing * .55, -25, -80 - armSwing, '#a94a40', '#a96f50', 17, 11);
  limb(22, -132, 33, -105 + armSwing * .55, 25, -80 + armSwing, '#bd5547', '#bd7955', 17, 11);

  // Thigh and calf motion creates a clear push-off and airborne phase.
  const leftStep = state.boardTime>0 ? .2 : state.mode==='ready' ? .08 : stride;
  const rightStep = state.boardTime>0 ? -.2 : state.mode==='ready' ? -.08 : opposing;
  const leg = (side, step) => {
    const hipX = side * 10, kneeX = side * 10 + step * 19, kneeY = -58 + Math.abs(Math.min(0, step)) * 13;
    const footX = side * 12 - step * 29, footY = -6 - Math.max(0, step) * 10;
    limb(hipX, -72, kneeX, kneeY, footX, footY, '#273c44', '#1c3037', 18, 14);
    ctx.save(); ctx.translate(footX, footY); ctx.rotate(step * .22); ctx.fillStyle = '#eef0df'; roundedRect(-11, -7, 26, 14, 5); ctx.fill(); ctx.restore();
  };
  leg(-1, leftStep); leg(1, rightStep);

  const jacket = ctx.createLinearGradient(-32, 0, 33, 0);
  jacket.addColorStop(0, '#7d302d'); jacket.addColorStop(.45, '#d45b4c'); jacket.addColorStop(1, '#8f332f');
  ctx.fillStyle = jacket; roundedRect(-29, -148, 58, 82, 13); ctx.fill();
  line(-24, -78, 24, -78, '#eab08b', 3); line(-20, -141, -18, -87, 'rgba(255,192,158,.65)', 2);
  ctx.fillStyle = '#fff3dc'; ctx.font = '900 27px Arial'; ctx.textAlign = 'center'; ctx.fillText('AJ', 0, -107);
  ctx.font = '700 7px Arial'; ctx.fillText('RUNNER', 0, -94);

  ctx.fillStyle = '#a66b4d'; roundedRect(-9, -160, 18, 18, 5); ctx.fill();
  ctx.fillStyle = '#bd7a57'; roundedRect(-20, -193, 40, 38, 13); ctx.fill();
  ctx.fillStyle = '#222a2b'; roundedRect(-22, -201, 44, 27, 11); ctx.fill();
  line(-16, -194, 11, -196, '#59605a', 3);
  ctx.restore();
}
