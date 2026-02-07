# **AlphaInsight: Professional Technical Implementation & Architecture Manual**

## **1. Platform Vision**
AlphaInsight is an institutional-grade financial analysis platform designed to ingest high-volume PDF annual reports (up to 300+ pages) and transform them into structured intelligence. This document provides a complete blueprint for developers to replicate the system from scratch.

---

## **2. System Architecture (The "Tri-Layer" Model)**
The application operates on three distinct layers:
1.  **Client Layer (React 19.0):** Handles binary file ingestion, state management, and SVG-based data visualization.
2.  **Cloud Layer (Firebase):** Manages user sessions (Auth) and provides a real-time NoSQL synchronization for analysis history.
3.  **Intelligence Layer (Gemini 3.0 Flash):** Processes high-density PDF data via a specialized prompt-schema bridge.

---

## **3. Implementation Roadmap (Step-by-Step)**

### **Phase 1: Environment & Dependency Setup**
Initialize a clean React project and install the following critical dependencies:
*   `@google/genai`: For the reasoning engine interface.
*   `firebase`: For database and authentication services.
*   `recharts`: For high-fidelity financial charting.
*   `tailwindcss`: For institutional UI design.

**File Structure Blueprint:**
```text
/src
  /components
    Header.tsx       # Navigation & Auth controls
    FileUpload.tsx   # Binary stream handler
    Dashboard.tsx    # Primary data consumer
    HistoryList.tsx  # Cloud data listener
    Auth.tsx         # Identity management
  /services
    aiService.ts     # Intelligence pipeline
  /lib
    firebase.ts      # Cloud config
  /types.ts          # Global interface definitions
  App.tsx            # Orchestration layer
```

---

### **Phase 2: Cloud Infrastructure & Security**
**Step 1: Firebase Configuration**
Set up a Firebase project and enable "Email/Password" Auth and "Realtime Database".
**Database Schema Logic:**
```json
{
  "users": {
    "USER_UID": {
      "history": {
        "PUSH_ID": {
          "company_name": "string",
          "metrics": "array",
          "timestamp": "serverTimestamp"
        }
      }
    }
  }
}
```

---

### **Phase 3: The Intelligence Pipeline (Core Service)**
This is the most critical logic block. We use **Schema-Enforced Extraction** to ensure the AI always returns valid JSON.

**Logic Flow (aiService.ts):**
1.  Receive File in Base64 format.
2.  Define a `responseSchema` to map PDF pixels to specific financial keys.
3.  Execute the request using `gemini-3-flash-preview`.

**Pseudo-code for Engine Logic:**
```javascript
FUNCTION analyzePDF(base64Data):
  PROMPT = "You are a Senior Auditor. Extract: Revenue, Profit, Assets, Liabilities. 
           Compare current vs previous fiscal years. Provide summary."
  
  SCHEMA = {
    type: OBJECT,
    properties: {
      company_name: STRING,
      metrics: ARRAY of { label, current_year, previous_year, unit }
    }
  }

  RESPONSE = EXECUTE_AI_CALL(base64Data, PROMPT, SCHEMA)
  RETURN JSON_PARSE(RESPONSE)
END FUNCTION
```

---

### **Phase 4: Frontend Development (Component Logic)**

**Step 1: The Binary Handler (`FileUpload.tsx`)**
*   **Logic:** Capture file via `<input type="file" />`.
*   **Safety:** Validate `mimeType === 'application/pdf'`.
*   **Transformation:** Use `FileReader.readAsDataURL` to prepare the stream for the AI pipeline.

**Step 2: The Real-time Sync (`App.tsx`)**
*   **Logic:** Use `onAuthStateChanged` to listen for user sessions.
*   **Logic:** Once logged in, use `onValue` to open a socket to the user's history path in the cloud.

**Step 3: The Quantitative Dashboard (`Dashboard.tsx`)**
*   **Logic:** Map the extracted JSON array into the `Recharts` engine.
*   **Formula (Growth):** `((Current - Previous) / Previous) * 100`.
*   **Logic:** Display growth indicators (↑/↓) using conditional styling (`text-emerald-500` vs `text-rose-500`).

---

### **Phase 5: UI/UX Philosophy (Institutional Design)**
To achieve a professional "Bloomberg-style" look:
1.  **Typography:** Use 'Inter' with varied font-weights to establish hierarchy.
2.  **Color Palette:** Slate-900 (Text), Slate-50 (Background), and Blue-600 (Primary Action).
3.  **State Feedback:** Every async action must trigger a skeleton loader or a spinner to maintain the "High-Performance" feel.

---

## **4. Prompt Engineering Specifications**
The secret to the platform's accuracy is the System Instruction. The engine is instructed to:
*   Ignore all marketing/PR pages.
*   Focus exclusively on the "Statement of Financial Position".
*   Normalize all currencies to the reporting unit found in the document.
*   Handle missing values as `0` to prevent chart crashes.

---

## **5. Building for Production**
1.  **Optimization:** Run `npm run build` to generate a minified, tree-shaken bundle.
2.  **API Security:** Ensure the API key is strictly accessed via `process.env`.
3.  **Deployment:** Deploy to a secure HTTPS environment to ensure PDF data remains encrypted during transit.

---
*Manual compiled by the AlphaInsight Engineering Team. Authorized for internal implementation.*