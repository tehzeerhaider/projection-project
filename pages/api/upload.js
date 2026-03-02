import { createClient } from "@supabase/supabase-js"

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
}

const CIRCLE_RADIUS = 1000

function getInitials(name) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 50%)`
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { name, connectTo } = req.body

    if (!name) {
      return res.status(400).json({ error: "Name is required" })
    }

    /* ---- count existing nodes ---- */
    const { count } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })

    const isFirstNode = count === 0

    if (!isFirstNode && !connectTo) {
      return res.status(400).json({
        error: "Connection is required after first participant",
      })
    }

    /* ---- random position in circle ---- */
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * CIRCLE_RADIUS

    const pos_x = r * Math.cos(angle)
    const pos_y = r * Math.sin(angle)

    /* ---- insert node ---- */
    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert([
        {
          name,
          initials: getInitials(name),
          pos_x,
          pos_y,
          color: randomColor(),
        },
      ])
      .select()
      .single()

    if (nodeError) throw nodeError

    /* ---- insert connection ONLY if not first ---- */
    if (!isFirstNode) {
      const { error: connError } = await supabase
        .from("connections")
        .insert([
          {
            from_node: node.id,
            to_node: connectTo,
          },
        ])

      if (connError) throw connError
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}