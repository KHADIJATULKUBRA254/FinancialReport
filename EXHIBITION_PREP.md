# **AlphaInsight: Exhibition Defense & Technical Q&A Guide**

This document prepares the team for logical and technical questioning by faculty or industry experts during the FYP exhibition.

---

## **Category 1: AI & Data Extraction (The Core Engine)**

**Q1: Most AI models have a context limit. How does AlphaInsight handle a 300-page financial report without crashing?**
*   **Answer:** We utilize the **Gemini 3.0 Flash** engine, which features a **1-million-token context window**. Unlike older models (like GPT-4 with 128k), Gemini can ingest the entire binary PDF in a single pass. We don't perform "chunking" (which loses context); we perform "holistic analysis," allowing the AI to understand the relationship between footnotes and the main Balance Sheet.

**Q2: How do you ensure the AI doesn't "hallucinate" (make up numbers)?**
*   **Answer:** We use **Schema-Enforced Extraction**. By defining a strict `responseSchema` (JSON) in the API config, we force the model to map its findings into specific keys. If the model can't find a value, the schema requires a `0` or `null` instead of a creative text explanation. Furthermore, our system instructions explicitly command the AI to focus only on the "Audited Financial Statements" section.

**Q3: Why did you choose the 'Flash' model over the 'Pro' model?**
*   **Answer:** For an exhibition demo, **latency (speed)** and **cost** are critical. Flash provides a response in 5-10 seconds, whereas Pro might take 30-40 seconds. For financial data extraction, Flash's reasoning capabilities are more than sufficient, making it the most efficient choice for real-time institutional analysis.

---

## **Category 2: Architecture & Infrastructure**

**Q4: Why use a Realtime Database (Firebase) instead of a standard SQL database like MySQL?**
*   **Answer:** Our platform is designed for **collaborative responsiveness**. Firebase Realtime Database uses WebSockets, allowing the "History Sidebar" to update instantly the moment an analysis is finished without a page refresh. It also handles User Authentication and JSON data storage natively, reducing the complexity of the backend.

**Q5: How is user data secured? Can User A see User B's financial history?**
*   **Answer:** No. We implemented **per-user data isolation**. Every history item is stored under a path unique to the user's UID (`/users/${uid}/history`). Firebase Security Rules (Server-side) ensure that a request to read data only succeeds if the authenticated UID matches the path being requested.

**Q6: What happens if the PDF is not a financial report?**
*   **Answer:** The system has two layers of defense. First, the UI filters for `application/pdf`. Second, the AI System Instruction defines the persona of a "Senior Auditor." If the document contains no financial tables, the AI returns an empty schema or an error message stating that no relevant financial data was detected.

---

## **Category 3: UI/UX & Visualization**

**Q7: Why use Recharts instead of static images?**
*   **Answer:** Recharts uses **SVG rendering**, which allows for interactivity. Users can hover over bars to see exact values. This provides a "Bloomberg Terminal" experience where data is alive and explorable, rather than just a flat report.

**Q8: Your dashboard shows a "Growth Percentage." How is this calculated?**
*   **Answer:** We implemented a frontend calculation logic: `((Current Year Value - Previous Year Value) / Previous Year Value) * 100`. This provides immediate context to the raw numbers, telling the analyst if the company is expanding or shrinking.

---

## **Category 4: Business & Scalability**

**Q9: How scalable is this for a real business?**
*   **Answer:** The architecture is highly scalable. Since the processing is "Serverless" (using Google Cloud and Firebase), we don't have to manage servers. We could theoretically handle thousands of users simultaneously. The only bottleneck would be the API "Rate Limits," which can be increased by upgrading to a Paid Tier.

**Q10: What is the cost per analysis?**
*   **Answer:** Because we use Gemini 1.5/3 Flash, the cost is extremely low. Analyzing a 300-page PDF costs approximately **$0.01 to $0.02 (approx. 4-6 PKR)**. This makes AlphaInsight significantly more cost-effective than hiring human analysts for manual data entry.

---

## **Quick Tips for the Demo:**
1.  **Be Confident about "Tokens":** If they ask about size, mention "Tokens." 1 page $\approx$ 500-1000 tokens.
2.  **Focus on "Verified Extraction":** Emphasize that the AI is not just reading text; it is understanding the *structure* of financial tables.
3.  **The "Why":** If asked why you built this, say: "To solve the data-entry bottleneck in financial research."

---
*Prepared for the AlphaInsight Final Year Project Exhibition.*