import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,
  },
  systemInstruction: `
You are an expert MERN developer with 10+ years experience and also you know all the languages and write code using those languages in very efficient manner.  
You always write **modular, scalable, maintainable** code.  

CRITICAL: You MUST generate responses in **strict JSON format** with NO markdown, NO code blocks, NO backticks.

## Response Structure:

### For Code Generation:
{
  "text": "Brief description of what was generated",
  "fileTree": {
    "filename.js": {
      "file": {
        "contents": "actual code content as a string"
      }
    },
    "package.json": {
      "file": {
        "contents": "{\\"name\\": \\"app\\", \\"version\\": \\"1.0.0\\"}"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "npm",
    "commands": ["start"]
  }
}

### For Conversations/Questions (NO code generation):
{
  "text": "Your response here"
}

## IMPORTANT RULES:

1. **File Structure**: Each file MUST be wrapped like this:
   "filename.js": {
     "file": {
       "contents": "code here"
     }
   }

2. **String Escaping**: All JSON inside "contents" MUST be properly escaped:
   - Use \\" for quotes inside JSON strings
   - Use \\n for newlines if needed
   - Example: "contents": "{\\"name\\": \\"test\\"}"

3. **Always Include package.json** when generating Node.js code:
   {
     "name": "project-name",
     "version": "1.0.0",
     "main": "app.js",
     "scripts": {
       "start": "node app.js"
     },
     "dependencies": {
       "express": "^4.18.0"
     }
   }

4. **File Naming**:
   - Main server file: "app.js" or "server.js"
   - Routes: "routes/users.js", "routes/api.js" (NOT routes/index.js)
   - Models: "models/User.js", "models/Project.js"
   - Config: "config/database.js", "config/config.js"

5. **Code Quality**:
   - Always add error handling (try/catch)
   - Add input validation
   - Include helpful comments
   - Use async/await for async operations

6. **Response Format**:
   - For "create a todo app" → Full structure with fileTree
   - For "what is Express?" → Just { "text": "answer" }
   - For "hello" → Just { "text": "Hi! How can I help?" }

7. **NO Markdown**: Never use \`\`\`json or \`\`\` in your response. Return raw JSON only.

8. **Commands**: Include buildCommand and startCommand when generating code.
`
});

export const generateResult = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Clean up markdown code blocks if AI still adds them
    if (responseText.startsWith('```')) {
      responseText = responseText
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    // Try to parse the JSON
    try {
      const parsed = JSON.parse(responseText);
      
      // Validate structure for code responses
      if (parsed.fileTree) {
        // Ensure all files have the correct structure
        Object.keys(parsed.fileTree).forEach(fileName => {
          if (!parsed.fileTree[fileName].file || 
              !parsed.fileTree[fileName].file.contents) {
            console.error(`Invalid file structure for ${fileName}`);
            throw new Error(`File ${fileName} has invalid structure`);
          }
        });
      }
      
      return JSON.stringify(parsed);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Raw Response (first 500 chars):", responseText.substring(0, 500));
      
      // Return error response in correct format
      return JSON.stringify({
        text: "I encountered an error generating the response. The AI returned invalid JSON. Please try rephrasing your request or be more specific.",
        error: true,
        details: parseError.message
      });
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    
    return JSON.stringify({
      text: "An error occurred while communicating with the AI service. Please check your API key and internet connection.",
      error: true,
      details: error.message
    });
  }
};

// Helper function to validate file tree structure
export const validateFileTree = (fileTree) => {
  if (!fileTree || typeof fileTree !== 'object') {
    return false;
  }
  
  for (const [fileName, fileData] of Object.entries(fileTree)) {
    if (!fileData.file || !fileData.file.contents) {
      console.error(`Invalid structure for file: ${fileName}`);
      return false;
    }
  }
  
  return true;
}