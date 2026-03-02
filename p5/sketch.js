// ==================================================
// CONSTANTS
// ==================================================
const CANVAS_WIDTH = 3840
const CANVAS_HEIGHT = 2160
const CIRCLE_DIAMETER = 2000
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2

const DOT_SIZE = 12
const TEXT_SIZE = 14
const MIN_DISTANCE = 26   // collision threshold

// ==================================================
// STATE
// ==================================================
const nodes = new Map()
const connections = []

let center
let confetti = []
let anchorId = null
let pulseFrame = 0

// ==================================================
// SETUP
// ==================================================
export async function setupP5(p, supabase) {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(TEXT_SIZE)
    p.smooth()

    center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

    const { data: n } = await supabase.from("nodes").select("*").order("created_at")
    const { data: c } = await supabase.from("connections").select("*")

    n.forEach(node => {
        nodes.set(node.id, node)
        if (!anchorId) anchorId = node.id
    })
    connections.push(...c)

    supabase
        .channel("nodes")
        .on("postgres_changes", { event: "INSERT", table: "nodes" }, pld => {
            nodes.set(pld.new.id, pld.new)
            if (!anchorId) anchorId = pld.new.id
            spawnConfetti(p)
        })
        .subscribe()

    supabase
        .channel("connections")
        .on("postgres_changes", { event: "INSERT", table: "connections" }, pld => {
            connections.push(pld.new)
        })
        .subscribe()
}

// ==================================================
// DRAW LOOP
// ==================================================
export function drawP5(p) {
    p.background(255)

    drawCircle(p)
    resolveCollisions()
    drawConnections(p)
    drawNodes(p)
    drawAnchorPulse(p)
    updateConfetti(p)

    pulseFrame++
}

// ==================================================
// RENDERING
// ==================================================
function drawCircle(p) {
    p.noFill()
    p.stroke(220)
    p.strokeWeight(3)
    p.circle(center.x, center.y, CIRCLE_DIAMETER)
}

// ------------------
// NODES
// ------------------
function drawNodes(p) {
    for (const node of nodes.values()) {
        const x = center.x + node.pos_x
        const y = center.y + node.pos_y

        p.noStroke()
        p.fill(node.color)
        p.circle(x, y, DOT_SIZE)

        p.fill(0)
        p.text(node.initials, x, y - 16)
    }
}

// ------------------
// CONNECTIONS (subtle pulse)
// ------------------
function drawConnections(p) {
    const alphaPulse = 120 + p.sin(pulseFrame * 0.03) * 40
    p.strokeWeight(1.5)

    for (const c of connections) {
        const a = nodes.get(c.from_node)
        const b = nodes.get(c.to_node)
        if (!a || !b) continue

        // Convert color string to p5 color
        const colorA = typeof a.color === "string" ? p.color(a.color) : a.color
        p.stroke(colorA.levels[0], colorA.levels[1], colorA.levels[2], alphaPulse)

        p.line(
            center.x + a.pos_x,
            center.y + a.pos_y,
            center.x + b.pos_x,
            center.y + b.pos_y
        )
    }
}

// ------------------
// ANCHOR PULSE
// ------------------
function drawAnchorPulse(p) {
    if (!anchorId) return
    const anchor = nodes.get(anchorId)
    if (!anchor) return

    const x = center.x + anchor.pos_x
    const y = center.y + anchor.pos_y

    const r = 22 + p.sin(pulseFrame * 0.05) * 6
    const a = 120 + p.sin(pulseFrame * 0.05) * 60

    p.noFill()
    p.stroke(0, a)
    p.strokeWeight(2)
    p.circle(x, y, r)
}

// ==================================================
// COLLISION AVOIDANCE (SOFT, STABLE)
// ==================================================
function resolveCollisions() {
    const list = Array.from(nodes.values())

    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            const a = list[i]
            const b = list[j]

            const dx = a.pos_x - b.pos_x
            const dy = a.pos_y - b.pos_y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 0 && dist < MIN_DISTANCE) {
                const push = (MIN_DISTANCE - dist) * 0.015
                const nx = dx / dist
                const ny = dy / dist

                a.pos_x += nx * push
                a.pos_y += ny * push
                b.pos_x -= nx * push
                b.pos_y -= ny * push
            }
        }
    }
}

// ==================================================
// CONFETTI
// ==================================================
function spawnConfetti(p) {
    for (let i = 0; i < 40; i++) {
        confetti.push({
            x: center.x,
            y: center.y,
            vx: p.random(-2, 2),
            vy: p.random(-3, -1),
            life: 80,
        })
    }
}

function updateConfetti(p) {
    p.noStroke()
    for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]
        c.x += c.vx
        c.y += c.vy
        c.life--
        p.fill(0, c.life * 3)
        p.circle(c.x, c.y, 3)
        if (c.life <= 0) confetti.splice(i, 1)
    }
}