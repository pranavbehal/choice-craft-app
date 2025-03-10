/**
 * Image Generation API Route Handler
 *
 * Integrates with Replicate API to generate dynamic scene images based on text prompts.
 * Handles image generation requests and error management for the story's visual elements.
 *
 * @route POST /api/generate-image
 */

import Replicate from "replicate";

/** Initialize Replicate client with API authentication */
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * POST request handler for image generation
 * @param {Request} req - Request object containing the image generation prompt
 * @returns {Response} JSON response with generated image URL or error details
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    /** Create image prediction with optimized parameters */
    const prediction = await replicate.predictions.create({
      version:
        "bf53bdb93d739c9c915091cfa5f49ca662d11273a5eb30e7a2ec1939bcf27a00",
      input: {
        prompt: prompt,
        go_fast: true, // Optimize for speed
        aspect_ratio: "16:9", // Widescreen format for better scene display
        output_format: "jpg", // Consistent format
        output_quality: 80, // Balance between quality and performance
        safety_tolerance: 2, // Moderate safety filter
        prompt_upsampling: true, // Enhance prompt details
      },
    });

    // Wait for the prediction to complete
    const result = await replicate.wait(prediction);

    // Process and return the generated image URL
    if (
      result.output &&
      Array.isArray(result.output) &&
      result.output.length > 0
    ) {
      const imageUrl = result.output[0];
      return Response.json({ imageUrl });
    }

    return Response.json({ error: "No image generated" }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
