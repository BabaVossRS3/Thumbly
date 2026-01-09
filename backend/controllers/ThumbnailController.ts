import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import Subscription from "../models/Subscription.js";
import { deductCredit } from "../utils/creditManagement.js";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import ai from "../configs/ai.js";
import path from "node:path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching thumbnail with bold typography, vibrant colors, expressive facial reactions, dramatic lighting, high contrast, click-worthy compositions, professional style, strong visual hierarchy, attention-grabbing elements",
  "Tech/Futuristic":
    "futuristic thumbnail with sleek design, neon accents, digital elements, circuit patterns, holographic effects, modern tech aesthetics, glowing effects, sci-fi inspired visuals, cutting-edge appearance",
  Minimalist:
    "minimalist thumbnail with clean lines, simple composition, ample whitespace, limited color palette, elegant typography, uncluttered design, modern aesthetic, focus on essential elements only",
  Photorealistic:
    "photorealistic thumbnail with high-quality photography, realistic lighting, natural textures, professional photography style, detailed imagery, authentic appearance, cinematic quality, lifelike rendering",
  Illustrated:
    "illustrated thumbnail with custom artwork, hand-drawn style, artistic elements, vibrant illustration, creative character design, unique artistic flair, colorful artwork, expressive illustration style",
};

const colorSchemeDescriptions = {
  vibrant:
    "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette, dynamic and lively appearance",
  sunset:
    "warm sunset tones, orange and red hues, golden gradients, warm lighting, romantic and dramatic atmosphere, glowing effects",
  ocean:
    "cool blue tones, aquatic colors, turquoise and cyan hues, water-inspired palette, calm and serene atmosphere, oceanic vibes",
  forest:
    "natural green tones, earthy colors, forest-inspired palette, organic textures, nature-based aesthetics, calm and grounded appearance",
  purple:
    "purple dream tones, violet and magenta hues, mystical atmosphere, creative and artistic vibes, elegant and sophisticated appearance",
  monochrome:
    "black and white tones, grayscale palette, high contrast, timeless aesthetic, professional and minimalist appearance, classic elegance",
  neon: "bright neon colors, fluorescent tones, electric vibes, cyberpunk aesthetic, high energy, glowing effects, futuristic appearance",
  pastel:
    "soft pastel colors, gentle tones, light and airy palette, delicate appearance, sweet and dreamy aesthetic, subtle and refined , low saturation",
};

//generate thumbnail

export const generateThumbnail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
    } = req.body;

    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user has credits available (without deducting)
    const subscription = await Subscription.findOne({ userId, status: "active" });
    if (!subscription) {
      return res.status(403).json({ 
        message: "No active subscription found",
        creditsUsed: 0,
        creditsRemaining: 0,
      });
    }

    const creditsRemaining = Math.max(0, subscription.credits.limit - subscription.credits.used);
    if (creditsRemaining <= 0) {
      return res.status(403).json({ 
        message: "Credit limit reached",
        creditsUsed: subscription.credits.used,
        creditsRemaining: 0,
      });
    }

    const thumbnail = await Thumbnail.create({
      userId,
      title,
      prompt_used: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: true,
    });

    const model = "gemini-3-pro-image-preview";
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspect_ratio || "16:9",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    let promt = `Create a ${
      stylePrompts[style as keyof typeof stylePrompts]
    } for "${title}"`;

    if (color_scheme) {
      promt += ` Use a ${
        colorSchemeDescriptions[
          color_scheme as keyof typeof colorSchemeDescriptions
        ]
      } color scheme.`;
    }

    if (user_prompt) {
      promt += ` Additional Details: ${user_prompt}.`;
    }

    promt += ` The thumbnail should be ${aspect_ratio}, visually stunning, and designed to maximise click-through rate. Make it bold, professional and impossible to ignore.`;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    //generate the image using the ai model
    const response: any = await ai.models.generateContent({
      model,
      contents: [promt],
      config: generationConfig,
    });

    //check if response is valid
    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected response");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
        break;
      }
    }

    const filename = `final-output-${Date.now()}.png`;
    const filePath = path.join("images", filename);

    //create the images directory if it doesnt exist
    try {
      fs.mkdirSync("images", { recursive: true });
    } catch (error) {
      console.error("Error creating directory:", error);
      await Thumbnail.findByIdAndDelete(thumbnail._id);
      res.status(500).json({ message: "Error creating directory" });
      return;
    }

    try {
      //save the image to the file system
      fs.writeFileSync(filePath, finalBuffer!);
    } catch (error) {
      console.error("Error writing file:", error);
      await Thumbnail.findByIdAndDelete(thumbnail._id);
      res.status(500).json({ message: "Error writing file" });
      return;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: "image",
      });
      thumbnail.image_url = uploadResult.url;
      thumbnail.isGenerating = false;

      await thumbnail.save();

      // Deduct credit ONLY after successful upload using atomic operation
      const finalCreditResult = await deductCredit(userId);
      if (!finalCreditResult.success) {
        // If credit deduction fails after successful upload, log error but don't fail the request
        // The thumbnail was successfully generated, so we keep it
        console.error(`Critical: Failed to deduct credit for user ${userId} after successful generation: ${finalCreditResult.message}`);
      }

      res.json({ message: "Thumbnail generated successfully", thumbnail });
    } catch (error) {
      console.error("Error uploading file:", error);
      await Thumbnail.findByIdAndDelete(thumbnail._id);
      res.status(500).json({ message: "Error uploading file" });
    } finally {
      try {
        //remove image from disk
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "An error occurred while generating thumbnail" });
  }
};

// delete thumbnail
export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session;

    const thumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId });

    if (!thumbnail) {
      res.status(404).json({ message: "Thumbnail not found" });
      return;
    }

    res.json({ message: "Thumbnail deleted successfully" });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "An error occurred while deleting thumbnail" });
  }
};
