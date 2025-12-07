import { useEffect, useRef } from "react"
import { setupP5, drawP5 } from "./sketch"

export default function SketchWrapper({ supabase }) {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!window.p5) {
            console.error("p5 not loaded")
            return
        }

        const sketch = (p) => {
            p.setup = () => setupP5(p, supabase)
            p.draw = () => drawP5(p)
        }

        const instance = new window.p5(sketch, containerRef.current)

        return () => instance.remove()
    }, [])

    return <div ref={containerRef}></div>
}
