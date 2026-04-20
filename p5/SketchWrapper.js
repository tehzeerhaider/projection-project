import { useEffect, useRef } from "react"
import { setupP5, drawP5 } from "./sketch"

const CANVAS_WIDTH = 3840
const CANVAS_HEIGHT = 2160

export default function SketchWrapper({ supabase }) {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!window.p5) {
            console.error("p5 not loaded")
            return
        }

        const sketch = (p) => {
            p.setup = () => {
                setupP5(p, supabase)

                // grab canvas after creation
                canvasRef.current = p.canvas

                applyScale()
                window.addEventListener("resize", applyScale)
            }

            p.draw = () => drawP5(p)
        }

        const instance = new window.p5(sketch, containerRef.current)

        function applyScale() {
            if (!canvasRef.current) return

            const scale = Math.min(
                window.innerWidth / CANVAS_WIDTH,
                window.innerHeight / CANVAS_HEIGHT
            )

            canvasRef.current.style.transform = `scale(${scale})`
            canvasRef.current.style.transformOrigin = "top left"
        }

        return () => {
            window.removeEventListener("resize", applyScale)
            instance.remove()
        }
    }, [])

    return <div ref={containerRef} />
}