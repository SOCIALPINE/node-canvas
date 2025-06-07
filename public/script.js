const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const SIZE = 100;
const COOLDOWN_MS = 5000;
let lastPlacedTime = parseInt(localStorage.getItem('lastPlacedTime') || '0');
let pixelData = []; 
let userId = localStorage.getItem('userId');
let currentColor = '#ff0000';

// Function to check if user can place a pixel
function canPlacePixel() {
  const now = Date.now();
  const timeLeft = COOLDOWN_MS - (now - lastPlacedTime);
  return timeLeft <= 0;
}

// Function to get remaining cooldown time
function getRemainingCooldown() {
  const now = Date.now();
  const timeLeft = COOLDOWN_MS - (now - lastPlacedTime);
  return Math.max(0, timeLeft);
}

// Initialize Iro.js color picker
const colorPicker = new iro.ColorPicker('#colorPicker', {
  width: 400,
  height: 400,
  color: '#ff0000',
  borderWidth: 3,
  borderColor: '#666',
  layout: [
    {
      component: iro.ui.Wheel,
      options: {
        wheelLightness: true,
        wheelAngle: 0,
        wheelDirection: 'clockwise'
      }
    },
    {
      component: iro.ui.Slider,
      options: {
        sliderType: 'alpha'
      }
    }
  ]
});

// Update color value display
const colorValue = document.getElementById('colorValue');
colorPicker.on('color:change', (color) => {
  currentColor = color.hexString;
  colorValue.textContent = currentColor;
});

if (!userId) {
  userId = Math.random().toString(36).substr(2, 9);
  localStorage.setItem('userId', userId);
}
function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  canvas.width = size;
  canvas.height = size;
  drawCanvas();
}

window.addEventListener('resize', resizeCanvas);
socket.on('init', (data) => {
  pixelData = data;
  resizeCanvas();
});

// 서버에서 픽셀 업데이트 오면 해당 위치만 업데이트
socket.on('pixel_update', ({ x, y, color }) => {
  if (!pixelData[y]) return;
  pixelData[y][x] = color;
  drawPixel(x, y, color);
});

function drawPixel(x, y, color) {
  const pixelSize = canvas.width / SIZE;
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

function drawCanvas() {
  if (!pixelData.length) return;
  const pixelSize = canvas.width / SIZE;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = pixelData[y][x];
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
}

// Update the click handler to use the new cooldown system
canvas.addEventListener('click', (e) => {
    if (!canPlacePixel()) {
      const timeLeft = Math.ceil(getRemainingCooldown() / 1000);
      // alert(`Please wait ${timeLeft} seconds before placing another pixel`);
      return;
    }
    if (!pixelData.length) return;
  
    const rect = canvas.getBoundingClientRect();
    const pixelSize = canvas.width / SIZE;

    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    drawPixel(x, y, currentColor);
    pixelData[y][x] = currentColor;
    lastPlacedTime = Date.now();
    localStorage.setItem('lastPlacedTime', lastPlacedTime.toString());
    socket.emit('place_pixel', { x, y, color: currentColor, userId });
});
