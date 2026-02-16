import { createClient } from "@supabase/supabase-js"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
}

const CIRCLE_RADIUS = 800 // must match sketch.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const {
      image,
      fileName,
      uploader_name,
      connected_to, // OPTIONAL
      scale = 1,
    } = req.body

    if (!image || !fileName || !uploader_name) {
      return res.status(400).json({
        error: "Missing required fields",
      })
    }

    /* ----------------------------------
       1. Upload image to Supabase Storage
    ---------------------------------- */
    const buffer = Buffer.from(image, "base64")

    const { error: uploadError } = await supabase
      .storage
      .from("uploads")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase
      .storage
      .from("uploads")
      .getPublicUrl(fileName)

    /* ----------------------------------
       2. Generate random position (inside circle)
    ---------------------------------- */
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * CIRCLE_RADIUS

    const pos_x = radius * Math.cos(angle)
    const pos_y = radius * Math.sin(angle)

    /* ----------------------------------
       3. Validate optional connection
    ---------------------------------- */
    let finalConnectedTo = null

    if (connected_to) {
      const { data: target } = await supabase
        .from("images")
        .select("id")
        .eq("id", connected_to)
        .single()

      if (target) {
        finalConnectedTo = connected_to
      }
    }

    /* ----------------------------------
       4. Insert DB record
    ---------------------------------- */
    const { error: insertError } = await supabase
      .from("images")
      .insert([
        {
          image_url: publicUrlData.publicUrl,
          pos_x,
          pos_y,
          scale,
          connected_to: finalConnectedTo,
          uploader_name,
        },
      ])

    if (insertError) throw insertError

    res.status(200).json({
      success: true,
      url: publicUrlData.publicUrl,
    })
  } catch (err) {
    console.error("UPLOAD ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}
