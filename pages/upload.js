import { useState } from "react"

export default function UploadPage() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")

    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        setLoading(true)
        setStatus("Uploading...")

        const reader = new FileReader()

        reader.onloadend = async () => {
            try {
                const base64Image = reader.result.split(",")[1]
                const fileName = `image_${Date.now()}.jpg`

                const res = await fetch(`${window.location.origin}/api/upload`, {  // Use absolute URL
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64Image, fileName }),
                })

                // Check if the request was successful
                if (!res.ok) {
                    throw new Error(`Failed to upload image: ${res.statusText}`)
                }

                const data = await res.json()

                if (data.error) {
                    setStatus("❌ Upload failed: " + data.error)
                } else {
                    setStatus("✅ Upload successful!")
                }
            } catch (err) {
                console.error("Upload error:", err)
                setStatus("❌ Upload failed. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        reader.onerror = (error) => {
            console.error("FileReader error:", error)
            setStatus("❌ Error reading the file. Please try again.")
            setLoading(false)
        }

        reader.readAsDataURL(file)  // Read the file as base64
    }

    return (
        <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: 40 }}>
            <h1>Upload Image</h1>
            <input type="file" accept="image/*" onChange={handleUpload} />
            {loading && <p>{status}</p>}
            {!loading && status && <p>{status}</p>}
        </div>
    )
}
