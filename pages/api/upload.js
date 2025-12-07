import { createClient } from "@supabase/supabase-js"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb" // Allow image uploads of up to 10MB
    }
  }
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

    const { image, fileName } = req.body

    if (!image || !fileName) {
      return res.status(400).json({ error: "No image or fileName provided" })
    }

    const buffer = Buffer.from(image, "base64")

    // Upload the image to Supabase storage
    const { error: uploadError } = await supabase
      .storage
      .from("uploads")
      .upload(fileName, buffer, { contentType: "image/jpeg" })

    if (uploadError) throw uploadError

    const { data } = supabase
      .storage
      .from("uploads")
      .getPublicUrl(fileName)

    // Insert image URL into database
    const { error: dbError } = await supabase.from("images").insert([
      { image_url: data.publicUrl }
    ])

    if (dbError) throw dbError

    // Return the uploaded image URL immediately
    res.status(200).json({ success: true, url: data.publicUrl })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ error: err.message })
  }
}
