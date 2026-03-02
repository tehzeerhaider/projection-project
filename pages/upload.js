import { useEffect, useState } from "react"

export default function UploadPage() {
    const [name, setName] = useState("")
    const [connectTo, setConnectTo] = useState("")
    const [nodes, setNodes] = useState([])
    const [status, setStatus] = useState("")

    useEffect(() => {
        fetch("/api/get-names")
            .then(res => res.json())
            .then(setNodes)
    }, [])

    const isFirst = nodes.length === 0

    async function handleSubmit() {
        if (!name) {
            setStatus("❌ Please enter your name")
            return
        }

        if (!isFirst && !connectTo) {
            setStatus("❌ Please select a connection")
            return
        }

        setStatus("Uploading...")

        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, connectTo }),
        })

        if (!res.ok) {
            setStatus("❌ Upload failed")
        } else {
            setStatus("✅ Added to circle")
            setName("")
            setConnectTo("")
        }
    }

    return (
        <div style={{ padding: 40, background: "#000000", minHeight: "100vh" }}>
            <h2>Join the Circle</h2>

            <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ display: "block", marginBottom: 15 }}
            />

            <select
                value={connectTo}
                onChange={e => setConnectTo(e.target.value)}
                disabled={isFirst}
                style={{ display: "block", marginBottom: 10 }}
            >
                <option value="">
                    {isFirst
                        ? "First participant — no connection needed"
                        : "Select someone to connect with"}
                </option>

                {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                        {n.name}
                    </option>
                ))}
            </select>

            <button onClick={handleSubmit}>Submit</button>

            <p>{status}</p>
        </div>
    )
}