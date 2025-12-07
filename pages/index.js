import dynamic from "next/dynamic"
import { supabase } from "../lib/supabaseClient"

const Sketch = dynamic(() => import("../p5/SketchWrapper"), {
  ssr: false,
})

export default function Home() {
  return (
    <div style={{ overflow: "hidden" }}>
      <Sketch supabase={supabase} />
    </div>
  )
}
