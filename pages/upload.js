import { useEffect, useState } from "react"

export default function UploadPage() {

    const [name, setName] = useState("")
    const [photo, setPhoto] = useState(null)
    const [nodes, setNodes] = useState([])
    const [selected, setSelected] = useState([])
    const [status, setStatus] = useState("")

    useEffect(() => {
        fetch("/api/get-names")
            .then(res => res.json())
            .then(setNodes)
    }, [])

    const isFirst = nodes.length === 0

    function toggle(id) {
        if (selected.includes(id)) {
            setSelected(selected.filter(x => x !== id))
        } else {
            setSelected([...selected, id])
        }
    }

    function handleFile(e) {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            setPhoto(reader.result)
        }
        reader.readAsDataURL(file)
    }

    async function submit() {

        if (!name) {
            setStatus("Enter name")
            return
        }

        if (!photo) {
            setStatus("Upload photo")
            return
        }

        if (!isFirst && selected.length === 0) {
            setStatus("Select connection")
            return
        }

        setStatus("Uploading...")

        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                photo,
                connections: selected
            })
        })

        if (!res.ok) {
            setStatus("Upload failed")
        } else {
            setStatus("Added!")
            setName("")
            setPhoto(null)
            setSelected([])
        }
    }

    return (

        <div style={{
            padding: 20,
            background: "#000",
            color: "#fff",
            minHeight: "100vh"
        }}>

            <h1>Join the Circle</h1>

            <input
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                    display: "block",
                    marginBottom: 15,
                    padding: 10,
                    width: "100%",
                    maxWidth: 400
                }}
            />

            <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ marginBottom: 20 }}
            />

            {!isFirst && (

                <>
                    <h3>Select connections</h3>

                    <p>Selected: {selected.length}</p>

                    <div style={{
                        maxHeight: "60vh",
                        overflowY: "auto",
                        paddingRight: 10
                    }}>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                            gap: 16
                        }}>

                            {nodes.map(n => (

                                <div
                                    key={n.id}
                                    onClick={() => toggle(n.id)}
                                    style={{
                                        border: selected.includes(n.id)
                                            ? "2px solid #0f0"
                                            : "1px solid #444",
                                        padding: 10,
                                        borderRadius: 10,
                                        textAlign: "center",
                                        cursor: "pointer"
                                    }}
                                >

                                    <img
                                        src={n.photo_url}
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1 / 1",
                                            objectFit: "cover",
                                            borderRadius: "50%"
                                        }}
                                    />

                                    <p style={{ marginTop: 8 }}>{n.name}</p>

                                    <input
                                        type="checkbox"
                                        checked={selected.includes(n.id)}
                                        onChange={() => toggle(n.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />

                                </div>

                            ))}

                        </div>

                    </div>

                </>
            )}

            <br />

            <button onClick={submit}>
                Submit
            </button>

            <p>{status}</p>

        </div>
    )
}