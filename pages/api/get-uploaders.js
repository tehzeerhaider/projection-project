import { supabase } from "../../lib/supabaseClient"

export default async function handler(req, res) {
    try {
        const { data } = await supabase
            .from("images")
            .select("id, uploader_name")
            .order("created_at", { ascending: true })
        res.status(200).json(data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message })
    }
}
