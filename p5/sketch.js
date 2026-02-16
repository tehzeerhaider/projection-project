const CANVAS_WIDTH = 3840
const CANVAS_HEIGHT = 2160

const CIRCLE_DIAMETER = 2000
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2

const imageStore = new Map() // id -> { img, meta }
let supabaseClient
let circleCenter
let confetti = []
let highlightImageId = null

export async function setupP5(p, supabase) {
    supabaseClient = supabase

    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    p.angleMode(p.DEGREES)
    p.imageMode(p.CENTER)

    circleCenter = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
    }

    await loadInitialImages(p)

    supabaseClient
        .channel("images")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "images" },
            async payload => {
                const row = payload.new
                if (!imageStore.has(row.id)) {
                    await loadImageOnce(p, row)
                    highlightImageId = row.id
                    spawnConfetti(p)
                }
            }
        )
        .subscribe()

    p.loop()
}

async function loadInitialImages(p) {
    const { data } = await supabaseClient
        .from("images")
        .select("*")
        .order("created_at", { ascending: true })

    if (!data) return

    for (const row of data) {
        if (!imageStore.has(row.id)) {
            await loadImageOnce(p, row)
        }
    }
}

function loadImageOnce(p, row) {
    return new Promise(resolve => {
        p.loadImage(row.image_url, img => {
            imageStore.set(row.id, { img, meta: row })
            resolve()
        })
    })
}

export function drawP5(p) {
    p.background(0)

    drawCircle(p)
    drawConnections(p)
    drawImages(p)
    updateConfetti(p)
}

function drawCircle(p) {
    p.noFill()
    p.stroke(255, 120)
    p.strokeWeight(3)
    p.circle(circleCenter.x, circleCenter.y, CIRCLE_DIAMETER)
}

function drawImages(p) {
    const count = imageStore.size
    if (count === 0) return

    const baseSize = Math.max(48, 420 - count * 3.6) // fits ~100 images

    for (const [id, { img, meta }] of imageStore.entries()) {
        const x = circleCenter.x + meta.pos_x
        const y = circleCenter.y + meta.pos_y
        const scale = meta.scale || 1
        const size = baseSize * scale

        if (id === highlightImageId) {
            p.noFill()
            p.stroke(255, 180)
            p.strokeWeight(4)
            p.circle(x, y, size + 24)
        }

        p.image(img, x, y, size, size)
    }
}

function drawConnections(p) {
    p.strokeWeight(2)
    p.noFill()

    for (const { meta } of imageStore.values()) {
        if (!meta.connected_to) continue

        const target = imageStore.get(meta.connected_to)
        if (!target) continue

        const x1 = circleCenter.x + meta.pos_x
        const y1 = circleCenter.y + meta.pos_y
        const x2 = circleCenter.x + target.meta.pos_x
        const y2 = circleCenter.y + target.meta.pos_y

        const t = p.frameCount * 0.02
        const wobbleX = p.sin(t) * 6
        const wobbleY = p.cos(t) * 6

        p.stroke(255, 90)
        p.line(
            x1 + wobbleX,
            y1 + wobbleY,
            x2 - wobbleX,
            y2 - wobbleY
        )
    }
}

function spawnConfetti(p) {
    for (let i = 0; i < 60; i++) {
        const angle = p.random(360)
        const r = p.random(0, CIRCLE_RADIUS)

        confetti.push({
            x: circleCenter.x + r * p.cos(angle),
            y: circleCenter.y + r * p.sin(angle),
            vx: p.random(-1, 1),
            vy: p.random(-2.2, -0.8),
            life: 140,
            size: p.random(2, 4),
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

        p.fill(255, c.life * 1.6)
        p.circle(c.x, c.y, c.size)

        if (c.life <= 0) confetti.splice(i, 1)
    }
}
