let images = []
let supabaseClient
let radius = 950  // Radius for the circle
let qrCodeImage // Variable to store the QR code image
let imageCount = 0  // Counter to track the number of images

export async function setupP5(p, supabase) {
    supabaseClient = supabase

    p.createCanvas(3840, 2160)  // Set canvas size to 4K resolution
    p.angleMode(p.DEGREES)
    p.background(0)

    // Load the QR code image to display in the center of the circle
    qrCodeImage = p.loadImage("/qr-code.png")

    // Load the initial images
    await loadImages(p)

    // Subscribe to real-time changes for INSERT events (new images added)
    supabaseClient
        .channel("images")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "images" },
            () => loadImages(p)  // Reload images in real-time when an image is inserted
        )
        .subscribe()
}

// Function to load images from Supabase
async function loadImages(p) {
    const { data } = await supabaseClient
        .from("images")
        .select("*")
        .order("id", { ascending: false })

    // Clear the images array if we exceed 10 images
    if (imageCount >= 10) {
        console.log("Resetting images after 10 uploads")
        images = []  // Clear images array
        imageCount = 0  // Reset image counter
    }

    // Load new images into the array
    for (let row of data) {
        p.loadImage(row.image_url, (img) => {
            images.push(img)  // Add the new image
            imageCount++  // Increment the image counter
        })
    }
}

export function drawP5(p) {
    p.background(0)

    // Draw the boundary circle at the center of the canvas
    p.noFill()
    p.stroke(255)
    p.strokeWeight(4)
    p.ellipse(p.width / 2, p.height / 2, 2200, 2200)  // Circle with diameter of 2200px

    const angleStep = 360 / Math.max(images.length, 1)
    const maxImageSize = 200  // Maximum image size, adjust as necessary

    // Draw the images around the circle
    for (let i = 0; i < images.length; i++) {
        const angle = i * angleStep
        const x = p.width / 2 + radius * p.cos(angle)
        const y = p.height / 2 + radius * p.sin(angle)

        const img = images[i]
        if (!img) continue

        // Scale the images to fit inside the circle
        const imageSize = Math.min(maxImageSize, radius * 2 / images.length)

        p.push()
        p.translate(x, y)
        p.rotate(angle + 90)
        p.imageMode(p.CENTER)
        p.image(img, 0, 0, imageSize, imageSize)  // Scale images proportionally
        p.pop()
    }

    // Draw the QR code in the center of the circle
    const qrCodeSize = 300  // Size of the QR code
    p.imageMode(p.CENTER)
    p.image(qrCodeImage, p.width / 2, p.height / 2, qrCodeSize, qrCodeSize)  // Position QR in center of the circle
}
