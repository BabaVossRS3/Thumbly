import ai from "../configs/ai.js";
import { GenerateContentConfig } from "@google/genai";

export const generateVideoMetadata = async (
  videoTopic: string,
  thumbnailStyle?: string,
  additionalContext?: string
) => {
  try {
    const model = "gemini-2.0-flash";
    
    let prompt = `You are a YouTube SEO expert. Generate optimized metadata for a YouTube video about: "${videoTopic}".`;
    
    if (thumbnailStyle) {
      prompt += ` The video has a ${thumbnailStyle} style thumbnail.`;
    }
    
    if (additionalContext) {
      prompt += ` Additional context: ${additionalContext}`;
    }
    
    prompt += `\n\nGenerate the following in JSON format:
{
  "title": "An engaging, SEO-optimized title (max 100 characters, include keywords, make it clickable)",
  "description": "A detailed, keyword-rich description (300-500 words, include timestamps placeholder, call-to-action, relevant hashtags)",
  "tags": ["array", "of", "15-20", "relevant", "tags", "including", "long-tail", "keywords"],
  "category": "YouTube category ID as string (22 for People & Blogs, 28 for Science & Technology, 24 for Entertainment, 10 for Music, 20 for Gaming, 26 for Howto & Style, 27 for Education)"
}

Make it engaging, SEO-friendly, and optimized for maximum reach. The title should be attention-grabbing but not clickbait.`;

    const generationConfig: GenerateContentConfig = {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    const response = await ai.models.generateContent({
      model,
      contents: [prompt],
      config: generationConfig,
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No response text from AI");
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }
    
    // Clean the JSON string to handle control characters
    let jsonString = jsonMatch[0];
    // Replace unescaped newlines and tabs in strings
    jsonString = jsonString.replace(/[\n\r\t]/g, ' ');
    
    const metadata = JSON.parse(jsonString);
    
    // Validate and clean tags for YouTube requirements
    let tags = metadata.tags || [];
    if (Array.isArray(tags)) {
      tags = tags
        .map((tag: string) => {
          // Remove special characters and trim
          return tag.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
        })
        .filter((tag: string) => {
          // Keep only tags that are 1-30 characters long
          return tag.length > 0 && tag.length <= 30;
        })
        .slice(0, 10); // Limit to 10 tags per video
    }
    
    return {
      title: metadata.title,
      description: metadata.description,
      tags: tags,
      category: metadata.category || "22",
    };
  } catch (error: any) {
    console.error("Error generating video metadata:", error);
    throw new Error("Failed to generate video metadata");
  }
};
