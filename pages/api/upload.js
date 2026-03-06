import { createClient } from "@supabase/supabase-js"

export const config = {
  api: { bodyParser: { sizeLimit: "5mb" } }
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
  return `hsl(${hue},70%,50%)`
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {

    const { name, photo, connections } = req.body

    if (!name) {
      return res.status(400).json({ error: "Name required" })
    }


    let photo_url = null

    if (photo) {

      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")

      const filename = `${Date.now()}-${Math.random()}.jpg`

      const { error: uploadError } = await supabase
        .storage
        .from("photos")
        .upload(filename, buffer, {
          contentType: "image/jpeg"
        })

      if (uploadError) throw uploadError

      const { data } = supabase
        .storage
        .from("photos")
        .getPublicUrl(filename)

      photo_url = data.publicUrl
    }


    const { count } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })

    const isFirst = count === 0


    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * CIRCLE_RADIUS

    const pos_x = r * Math.cos(angle)
    const pos_y = r * Math.sin(angle)


    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert([
        {
          name,
          initials: getInitials(name),
          photo_url,
          pos_x,
          pos_y,
          color: randomColor()
        }
      ])
      .select()
      .single()

    if (nodeError) throw nodeError

    if (!isFirst && connections?.length) {

      const rows = connections.map(id => ({
        from_node: node.id,
        to_node: id
      }))

      const { error } = await supabase
        .from("connections")
        .insert(rows)

      if (error) throw error
    }

    res.status(200).json({ success: true })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}