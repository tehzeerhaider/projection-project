let images = []
let supabaseClient
let radius = 950  // Radius for the circle
let qrCodeImage // Variable to store the QR code image
let imageCount = 0  // Counter to track the number of images
let confettiParticles = []  // Array to store the confetti particles
let confettiDuration = 100  // Duration for confetti effect

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

    // Reset images array and count when new images are loaded
    images = []  // Clear the images array first
    imageCount = 0  // Reset image counter

    // Load new images into the array
    for (let row of data) {
        p.loadImage(row.image_url, (img) => {
            images.push(img)  // Add the new image
            imageCount++  // Increment the image counter
            triggerConfetti(p)  // Trigger confetti effect on new image upload
        })
    }
}

// Function to trigger confetti animation
function triggerConfetti(p) {
    for (let i = 0; i < 100; i++) {  // Create 100 confetti particles
        confettiParticles.push(new Confetti(p))
    }
}

// Confetti particle class
class Confetti {
    constructor(p) {
        this.x = p.width / 2
        this.y = p.height / 2
        this.size = p.random(5, 15)  // Random size
        this.speedX = p.random(-5, 5)  // Random horizontal speed
        this.speedY = p.random(-5, 5)  // Random vertical speed
        this.color = p.color(p.random(255), p.random(255), p.random(255))  // Random color
        this.lifetime = 255  // Full opacity initially
    }

    update(p) {
        this.x += this.speedX
        this.y += this.speedY
        this.lifetime -= 5  // Fade out the particle over time

        // Remove the particle when its lifetime is over
        if (this.lifetime <= 0) {
            return false
        }
        return true
    }

    display(p) {
        p.noStroke()
        p.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifetime)
        p.ellipse(this.x, this.y, this.size, this.size)
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

    // Dynamically adjust image size based on number of images
    const maxImageSize = Math.min(350, 2200 / images.length)  // Increase max size and adjust for more images

    // Draw the images around the circle
    for (let i = 0; i < images.length; i++) {
        const angle = i * angleStep
        // Adjust the radius dynamically to move images towards the center based on image size
        const dynamicRadius = radius - (maxImageSize / 2)  // Move closer to the center based on image size

        const x = p.width / 2 + dynamicRadius * p.cos(angle)
        const y = p.height / 2 + dynamicRadius * p.sin(angle)

        const img = images[i]
        if (!img) continue

        // Get the image's original width and height
        const imgWidth = img.width
        const imgHeight = img.height

        // Calculate the aspect ratio of the image
        const aspectRatio = imgWidth / imgHeight

        // Scale the image proportionally to fit within the circle, but larger
        let imageWidth = maxImageSize
        let imageHeight = maxImageSize

        // Adjust dimensions to maintain the aspect ratio
        if (imgWidth > imgHeight) {
            // If the image is wider, adjust width
            imageHeight = maxImageSize / aspectRatio
        } else {
            // If the image is taller, adjust height
            imageWidth = maxImageSize * aspectRatio
        }

        p.push()
        p.translate(x, y)
        p.imageMode(p.CENTER)
        // Draw the image without distortion, scaled to fit inside the circle
        p.image(img, 0, 0, imageWidth, imageHeight)
        p.pop()
    }

    // Draw the QR code in the center
    p.imageMode(p.CENTER)
    p.image(qrCodeImage, p.width / 2, p.height / 2, 300, 300)

    // Update and display the confetti particles
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i]
        if (!particle.update(p)) {
            confettiParticles.splice(i, 1)  // Remove particle when lifetime ends
        } else {
            particle.display(p)  // Display the particle
        }
    }
}
