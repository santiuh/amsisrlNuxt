<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm" @keydown.escape="close">
      <!-- Botón cerrar -->
      <button class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10" @click="close">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Menú Principal -->
      <div v-if="!currentGame" class="flex flex-col items-center w-full max-w-md p-6">
        <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-wider uppercase mb-8 drop-shadow-lg text-center leading-tight">
          ARCADE<br>CLASSICS
        </h1>
        <div class="flex flex-col gap-4 w-full">
          <button
            class="py-4 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg text-xl font-bold uppercase tracking-wide border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all text-white"
            @click="startGame('breakout')"
          >
            🧱 Breakout
          </button>
          <button
            class="py-4 px-6 bg-green-600 hover:bg-green-500 rounded-lg text-xl font-bold uppercase tracking-wide border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all text-white"
            @click="startGame('snake')"
          >
            🐍 Snake
          </button>
          <button
            class="py-4 px-6 bg-red-600 hover:bg-red-500 rounded-lg text-xl font-bold uppercase tracking-wide border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-white"
            @click="startGame('racing')"
          >
            🏎️ Retro Racer
          </button>
        </div>
      </div>

      <!-- UI del Juego -->
      <template v-if="currentGame">
        <div class="flex flex-col items-center w-full px-4 mb-2">
          <div class="flex justify-between items-end w-full max-w-[480px]">
            <button class="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600 mb-1 text-white" @click="returnToMenu">
              ◀ Volver
            </button>
            <div class="text-right">
              <h2 :class="gameTitleClass" class="text-2xl font-bold uppercase tracking-wide m-0">{{ gameTitle }}</h2>
              <div class="font-mono text-sm text-gray-400 mt-1 h-5" v-html="gameStatsHtml" />
            </div>
          </div>
        </div>
        <div class="relative">
          <canvas
            ref="canvasRef"
            :class="{ 'bg-[#374151] border-[#4b5563]': currentGame === 'racing' }"
            class="bg-[#1f2937] block shadow-[0_10px_25px_rgba(0,0,0,0.8)] border-4 border-gray-700 rounded-lg max-w-full"
          />
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentGame = ref<string | null>(null)
const gameTitle = ref('')
const gameTitleClass = ref('')
const gameStatsHtml = ref('')

let animationFrameId: number | null = null
let gameLoopTimeoutId: ReturnType<typeof setTimeout> | null = null
let currentEventListeners: { target: EventTarget; type: string; listener: EventListenerOrEventListenerObject; options: boolean | AddEventListenerOptions }[] = []

function addGameListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions = false) {
  target.addEventListener(type, listener, options)
  currentEventListeners.push({ target, type, listener, options })
}

function clearAllGameListeners() {
  currentEventListeners.forEach(item => {
    item.target.removeEventListener(item.type, item.listener, item.options)
  })
  currentEventListeners = []
}

function stopCurrentGame() {
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null }
  if (gameLoopTimeoutId) { clearTimeout(gameLoopTimeoutId); gameLoopTimeoutId = null }
  clearAllGameListeners()
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function returnToMenu() {
  stopCurrentGame()
  currentGame.value = null
  gameStatsHtml.value = ''
}

function close() {
  stopCurrentGame()
  currentGame.value = null
  gameStatsHtml.value = ''
  emit('update:modelValue', false)
}

function startGame(gameName: string) {
  stopCurrentGame()
  currentGame.value = gameName

  nextTick(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (gameName === 'breakout') {
      gameTitle.value = 'Breakout'
      gameTitleClass.value = 'text-blue-400'
      canvas.width = 480; canvas.height = 320
      initBreakout(canvas, ctx)
    } else if (gameName === 'snake') {
      gameTitle.value = 'Snake'
      gameTitleClass.value = 'text-green-400'
      canvas.width = 400; canvas.height = 400
      initSnake(canvas, ctx)
    } else if (gameName === 'racing') {
      gameTitle.value = 'Retro Racer'
      gameTitleClass.value = 'text-red-500 italic'
      canvas.width = 320; canvas.height = 480
      initRacing(canvas, ctx)
    }
  })
}

// ==========================================
// ============ JUEGO: BREAKOUT =============
// ==========================================
function initBreakout(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let score = 0, lives = 3
  let isGameOver = false, isGameWon = false

  const ballRadius = 6
  let x = canvas.width / 2, y = canvas.height - 30
  let dx = 3, dy = -3

  const paddleHeight = 10, paddleWidth = 75
  let paddleX = (canvas.width - paddleWidth) / 2

  let rightPressed = false, leftPressed = false

  const brickRowCount = 5, brickColumnCount = 6
  const brickWidth = 65, brickHeight = 20, brickPadding = 10
  const brickOffsetTop = 40, brickOffsetLeft = 20

  let bricks: { x: number; y: number; status: number; color: string }[][] = []
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

  function setupBricks() {
    bricks = []
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = []
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, color: colors[r] }
      }
    }
  }
  setupBricks()

  function updateUI() {
    gameStatsHtml.value = `Puntos: <span class="text-white">${score}</span> | Vidas: <span class="text-white">${lives}</span>`
  }

  addGameListener(document, 'keydown', ((e: KeyboardEvent) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true
  }) as EventListener)
  addGameListener(document, 'keyup', ((e: KeyboardEvent) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false
  }) as EventListener)

  const handleMove = (clientX: number) => {
    const relativeX = clientX - canvas.getBoundingClientRect().left
    if (relativeX > 0 && relativeX < canvas.width) paddleX = relativeX - paddleWidth / 2
  }

  addGameListener(document, 'mousemove', ((e: MouseEvent) => handleMove(e.clientX)) as EventListener)
  addGameListener(document, 'touchmove', ((e: TouchEvent) => {
    if (e.target === canvas) e.preventDefault()
    handleMove(e.touches[0].clientX)
  }) as EventListener, { passive: false })

  const resetLevel = () => {
    if (isGameOver || isGameWon) {
      score = 0; lives = 3; isGameOver = false; isGameWon = false
      x = canvas.width / 2; y = canvas.height - 30; dx = 3; dy = -3
      paddleX = (canvas.width - paddleWidth) / 2
      setupBricks()
      updateUI()
    }
  }
  addGameListener(canvas, 'click', resetLevel)
  addGameListener(canvas, 'touchstart', resetLevel, { passive: false })

  function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r]
        if (b.status === 1) {
          if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
            dy = -dy; b.status = 0; score += 10
            if (score % 50 === 0) {
              dx = dx > 0 ? dx + 0.2 : dx - 0.2
              dy = dy > 0 ? dy + 0.2 : dy - 0.2
            }
            updateUI()
            if (score === brickRowCount * brickColumnCount * 10) isGameWon = true
          }
        }
      }
    }
  }

  function drawMessage(text: string, color: string) {
    ctx.font = 'bold 30px Arial'; ctx.fillStyle = color; ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    ctx.font = '14px Arial'; ctx.fillStyle = '#9ca3af'
    ctx.fillText('Toca para reiniciar', canvas.width / 2, canvas.height / 2 + 30)
    ctx.textAlign = 'left'
  }

  function draw() {
    if (currentGame.value !== 'breakout') return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (bricks[c][r].status === 1) {
          const bX = (c * (brickWidth + brickPadding)) + brickOffsetLeft
          const bY = (r * (brickHeight + brickPadding)) + brickOffsetTop
          bricks[c][r].x = bX; bricks[c][r].y = bY
          ctx.beginPath(); ctx.rect(bX, bY, brickWidth, brickHeight)
          ctx.fillStyle = bricks[c][r].color; ctx.fill()
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2
          ctx.strokeRect(bX, bY, brickWidth, brickHeight); ctx.closePath()
        }
      }
    }

    ctx.beginPath(); ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.closePath()

    ctx.beginPath(); ctx.rect(paddleX, canvas.height - paddleHeight - 5, paddleWidth, paddleHeight)
    ctx.fillStyle = '#60a5fa'; ctx.fill()
    ctx.strokeStyle = '#3b82f6'; ctx.strokeRect(paddleX, canvas.height - paddleHeight - 5, paddleWidth, paddleHeight)
    ctx.closePath()

    collisionDetection()

    if (isGameWon) { drawMessage('¡GANASTE!', '#4ade80'); return }
    if (isGameOver) { drawMessage('GAME OVER', '#f87171'); return }

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx
    if (y + dy < ballRadius) dy = -dy
    else if (y + dy > canvas.height - ballRadius - 5) {
      if (x > paddleX && x < paddleX + paddleWidth && y + dy < canvas.height) {
        dy = -dy; dx = (x - (paddleX + paddleWidth / 2)) * 0.15
      } else if (y + dy > canvas.height - ballRadius) {
        lives--; updateUI()
        if (!lives) isGameOver = true
        else { x = canvas.width / 2; y = canvas.height - 30; dx = 3; dy = -3; paddleX = (canvas.width - paddleWidth) / 2 }
      }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7
    else if (leftPressed && paddleX > 0) paddleX -= 7

    x += dx; y += dy
    animationFrameId = requestAnimationFrame(draw)
  }
  updateUI()
  draw()
}

// ==========================================
// ============== JUEGO: SNAKE ==============
// ==========================================
function initSnake(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const gridSize = 20
  const tileCount = canvas.width / gridSize
  let snake: { x: number; y: number }[]
  let food: { x: number; y: number }
  let sdx: number, sdy: number, score: number, isGameOver: boolean, speed: number
  let touchStartX = 0, touchStartY = 0

  function updateUI() {
    gameStatsHtml.value = `Puntos: <span class="text-white">${score}</span>`
  }

  function spawnFood() {
    let valid = false
    while (!valid) {
      food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }
      valid = true
      for (const s of snake) { if (s.x === food.x && s.y === food.y) { valid = false; break } }
    }
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]
    sdx = 0; sdy = -1; score = 0; speed = 120; isGameOver = false
    updateUI()
    spawnFood()
    if (gameLoopTimeoutId) clearTimeout(gameLoopTimeoutId)
    gameLoop()
  }

  addGameListener(document, 'keydown', ((e: KeyboardEvent) => {
    if ((e.key === 'ArrowUp' || e.key === 'w') && sdy !== 1) { sdx = 0; sdy = -1 }
    if ((e.key === 'ArrowDown' || e.key === 's') && sdy !== -1) { sdx = 0; sdy = 1 }
    if ((e.key === 'ArrowLeft' || e.key === 'a') && sdx !== 1) { sdx = -1; sdy = 0 }
    if ((e.key === 'ArrowRight' || e.key === 'd') && sdx !== -1) { sdx = 1; sdy = 0 }
  }) as EventListener)

  addGameListener(canvas, 'touchstart', ((e: TouchEvent) => {
    if (e.target === canvas) e.preventDefault()
    touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY
    if (isGameOver) resetGame()
  }) as EventListener, { passive: false })

  addGameListener(canvas, 'touchmove', ((e: TouchEvent) => { if (e.target === canvas) e.preventDefault() }) as EventListener, { passive: false })

  addGameListener(canvas, 'touchend', ((e: TouchEvent) => {
    const endX = e.changedTouches[0].screenX, endY = e.changedTouches[0].screenY
    const diffX = endX - touchStartX, diffY = endY - touchStartY
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 30) {
        if (diffX > 0 && sdx !== -1) { sdx = 1; sdy = 0 }
        else if (diffX < 0 && sdx !== 1) { sdx = -1; sdy = 0 }
      }
    } else {
      if (Math.abs(diffY) > 30) {
        if (diffY > 0 && sdy !== -1) { sdx = 0; sdy = 1 }
        else if (diffY < 0 && sdy !== 1) { sdx = 0; sdy = -1 }
      }
    }
  }) as EventListener, { passive: false })

  addGameListener(canvas, 'click', () => { if (isGameOver) resetGame() })

  function update() {
    if (isGameOver) return
    const head = { x: snake[0].x + sdx, y: snake[0].y + sdy }
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) { isGameOver = true; return }
    for (let i = 0; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { isGameOver = true; return } }

    snake.unshift(head)
    if (head.x === food.x && head.y === food.y) {
      score += 10; updateUI()
      if (speed > 50) speed -= 2
      spawnFood()
    } else snake.pop()
  }

  function draw() {
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444'
    ctx.beginPath(); ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2)
    ctx.fill(); ctx.shadowBlur = 0

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e'
      ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2)
    })

    if (isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = 'bold 30px Arial'; ctx.fillStyle = '#f87171'; ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 15)
      ctx.font = '16px Arial'; ctx.fillStyle = '#9ca3af'
      ctx.fillText('Toca para reiniciar', canvas.width / 2, canvas.height / 2 + 25)
    }
  }

  function gameLoop() {
    if (currentGame.value !== 'snake') return
    update(); draw()
    if (!isGameOver) gameLoopTimeoutId = setTimeout(gameLoop, speed)
  }

  resetGame()
}

// ==========================================
// ============= JUEGO: RACING ==============
// ==========================================
function initRacing(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const carWidth = 40, carHeight = 70
  let score: number, level: number, speed: number, isGameOver: boolean, roadOffset = 0
  let player: { x: number; y: number; color: string; speedX: number }
  let enemies: { x: number; y: number; width: number; height: number; color: string; speedY: number }[]
  let enemySpawnTimer: number
  const enemyColors = ['#ef4444', '#eab308', '#10b981', '#a855f7', '#f97316']
  const keys: Record<string, boolean> = { ArrowLeft: false, ArrowRight: false, a: false, d: false }
  let touchX: number | null = null

  function updateUI() {
    gameStatsHtml.value = `Pts: <span class="text-white">${Math.floor(score)}</span> | Nivel: <span class="text-yellow-400">${level}</span>`
  }

  function spawnEnemy() {
    const lanes = [40, 140, 240]
    enemies.push({
      x: lanes[Math.floor(Math.random() * lanes.length)],
      y: -carHeight, width: carWidth, height: carHeight,
      color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
      speedY: speed * (0.8 + Math.random() * 0.4),
    })
  }

  function resetGame() {
    score = 0; level = 1; speed = 4; isGameOver = false; enemies = []; enemySpawnTimer = 0
    player = { x: canvas.width / 2 - carWidth / 2, y: canvas.height - carHeight - 20, color: '#3b82f6', speedX: 0 }
    updateUI()
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    gameLoop()
  }

  addGameListener(window, 'keydown', ((e: KeyboardEvent) => { if (isGameOver) resetGame(); else if (Object.prototype.hasOwnProperty.call(keys, e.key)) keys[e.key] = true }) as EventListener)
  addGameListener(window, 'keyup', ((e: KeyboardEvent) => { if (Object.prototype.hasOwnProperty.call(keys, e.key)) keys[e.key] = false }) as EventListener)

  const handleTouch = (clientX: number) => { touchX = clientX - canvas.getBoundingClientRect().left }
  addGameListener(canvas, 'touchstart', ((e: TouchEvent) => { if (e.target === canvas) e.preventDefault(); if (isGameOver) resetGame(); else handleTouch(e.touches[0].clientX) }) as EventListener, { passive: false })
  addGameListener(canvas, 'touchmove', ((e: TouchEvent) => { if (e.target === canvas) e.preventDefault(); handleTouch(e.touches[0].clientX) }) as EventListener, { passive: false })
  addGameListener(canvas, 'touchend', () => { touchX = null })
  addGameListener(canvas, 'mousedown', ((e: MouseEvent) => { if (isGameOver) resetGame(); else handleTouch(e.clientX) }) as EventListener)
  addGameListener(canvas, 'mousemove', ((e: MouseEvent) => { if (e.buttons > 0) handleTouch(e.clientX) }) as EventListener)
  addGameListener(canvas, 'mouseup', () => { touchX = null })

  function drawCar(x: number, y: number, color: string, isPlayer: boolean) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 5, y + 5, carWidth, carHeight)
    ctx.fillStyle = '#111827'
    ctx.fillRect(x - 4, y + 10, 6, 14); ctx.fillRect(x + carWidth - 2, y + 10, 6, 14)
    ctx.fillRect(x - 4, y + carHeight - 24, 6, 14); ctx.fillRect(x + carWidth - 2, y + carHeight - 24, 6, 14)

    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, carWidth, carHeight, 8); ctx.fill()
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.roundRect(x + 5, y + 20, carWidth - 10, carHeight - 40, 4); ctx.fill()
    ctx.fillStyle = color; ctx.globalAlpha = 0.8; ctx.fillRect(x + 8, y + 30, carWidth - 16, carHeight - 60); ctx.globalAlpha = 1.0

    if (isPlayer) { ctx.fillStyle = '#ef4444'; ctx.fillRect(x + 5, y + carHeight - 4, 8, 4); ctx.fillRect(x + carWidth - 13, y + carHeight - 4, 8, 4) }
    else { ctx.fillStyle = '#fef08a'; ctx.fillRect(x + 5, y, 8, 4); ctx.fillRect(x + carWidth - 13, y, 8, 4) }
  }

  function drawRoad() {
    roadOffset += speed; if (roadOffset >= 40) roadOffset = 0
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(10, 0, 10, canvas.height); ctx.fillRect(canvas.width - 20, 0, 10, canvas.height)
    ctx.fillStyle = '#ffffff'
    for (let i = -40; i < canvas.height; i += 40) {
      ctx.fillRect(canvas.width / 3, i + roadOffset, 4, 20)
      ctx.fillRect((canvas.width / 3) * 2, i + roadOffset, 4, 20)
    }
  }

  function update() {
    if (isGameOver) return
    score += speed * 0.02; updateUI()
    if (score > level * 100) { level++; speed += 0.5 }

    if (keys.ArrowLeft || keys.a) player.speedX = -5
    else if (keys.ArrowRight || keys.d) player.speedX = 5
    else if (touchX === null) player.speedX = 0

    if (touchX !== null) player.x += ((touchX - carWidth / 2) - player.x) * 0.15
    else player.x += player.speedX

    if (player.x < 25) player.x = 25
    if (player.x > canvas.width - carWidth - 25) player.x = canvas.width - carWidth - 25

    enemySpawnTimer++
    if (enemySpawnTimer > Math.max(30, 80 - (speed * 3))) { spawnEnemy(); enemySpawnTimer = 0 }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]; e.y += speed * 0.8
      const m = 6, my = 10
      if (player.x + m < e.x + e.width - m && player.x + carWidth - m > e.x + m &&
        player.y + my < e.y + e.height - my && player.y + carHeight - my > e.y + my) {
        isGameOver = true
      }
      if (e.y > canvas.height) enemies.splice(i, 1)
    }
  }

  function draw() {
    if (currentGame.value !== 'racing') return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawRoad()
    enemies.forEach(e => drawCar(e.x, e.y, e.color, false))
    drawCar(player.x, player.y, player.color, true)

    if (isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f87171'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'
      ctx.fillText('¡CHOQUE!', canvas.width / 2, canvas.height / 2 - 20)
      ctx.fillStyle = '#ffffff'; ctx.font = '18px Arial'
      ctx.fillText(`Puntuación: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 20)
      ctx.fillStyle = '#9ca3af'; ctx.font = '14px Arial'
      ctx.fillText('Toca para reiniciar', canvas.width / 2, canvas.height / 2 + 60)
    }
  }

  function gameLoop() {
    if (currentGame.value !== 'racing') return
    update(); draw()
    if (!isGameOver) animationFrameId = requestAnimationFrame(gameLoop)
  }

  resetGame()
}

// Cleanup al desmontar
onUnmounted(() => {
  stopCurrentGame()
})

// Cleanup al cerrar con watch
watch(() => props.modelValue, (val) => {
  if (!val) {
    stopCurrentGame()
    currentGame.value = null
    gameStatsHtml.value = ''
  }
})
</script>
