import { useState, useEffect, useCallback } from "react"
import Cropper from "react-easy-crop"
import getCroppedImg from "../utils/cropImage"

export default function UploadPage() {
    const [imageFile, setImageFile] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const [uploaders, setUploaders] = useState([])
    const [connectedTo, setConnectedTo] = useState("")
    const [uploaderName, setUploaderName] = useState("")

    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")

    useEffect(() => {
        fetch("/api/get-uploaders")
            .then(res => res.json())
            .then(data => setUploaders(data || []))
            .catch(() => { })
    }, [])

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels)
    }, [])

    async function handleUpload() {
        if (!imageFile || !croppedAreaPixels || !uploaderName) {
            setStatus("❌ Please select image and enter your name")
            return
        }

        setLoading(true)
        setStatus("Uploading...")

        try {
            const croppedBase64 = await getCroppedImg(
                imageFile,
                croppedAreaPixels
            )

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: croppedBase64.split(",")[1],
                    fileName: `image_${Date.now()}.jpg`,
                    uploader_name: uploaderName,
                    connected_to: connectedTo || null,
                    scale: 1 // FIXED: do not use crop zoom
                }),
            })

            if (!res.ok) throw new Error("Upload failed")

            setStatus("✅ Upload successful!")
            setImageFile(null)
            setConnectedTo("")
            setUploaderName("")
        } catch (err) {
            console.error(err)
            setStatus("❌ Upload failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: 40 }}>
            <h1>Upload Image</h1>

            <input type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
            />

            <input
                placeholder="Your name"
                value={uploaderName}
                onChange={e => setUploaderName(e.target.value)}
                style={{ display: "block", marginTop: 15 }}
            />

            {uploaders.length > 0 && (
                <select
                    value={connectedTo}
                    onChange={e => setConnectedTo(e.target.value)}
                    style={{ display: "block", marginTop: 15 }}
                >
                    <option value="">No connection</option>
                    {uploaders.map(u => (
                        <option key={u.id} value={u.id}>
                            Connect to {u.uploader_name}
                        </option>
                    ))}
                </select>
            )}

            {imageFile && (
                <div style={{ position: "relative", width: 400, height: 400, marginTop: 20 }}>
                    <Cropper
                        image={URL.createObjectURL(imageFile)}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={loading}
                style={{ display: "block", marginTop: 30 }}
            >
                Upload
            </button>

            {status && <p>{status}</p>}
        </div>
    )
}
