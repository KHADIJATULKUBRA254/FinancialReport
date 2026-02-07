
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialData } from "../types";

/**
 * Institutional-grade financial analysis service.
 * Specifically tuned to extract: Total Assets, Total Liabilities, Revenue, and Net Profit.
 */
export const analyzeFinancialPDF = async (pdfBase64: string): Promise<FinancialData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            text: `Audit this annual report and extract exactly these four metrics: 
            1. 'Total Assets'
            2. 'Total Liabilities'
            3. 'Revenue'
            4. 'Net Profit (Profit after taxes)'
            
            Compare Current and Prior fiscal years. Return values as raw numbers.
            Provide a 5-line summary and a 'YES' or 'NO' invest_conclusion.`
          }
        ],
      },
      config: {
        systemInstruction: "You are a specialized financial auditor. You MUST return exactly four metrics in the array with these precise labels: 'Total Assets', 'Total Liabilities', 'Revenue', and 'Net Profit (Profit after taxes)'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_financial_statement: { type: Type.BOOLEAN },
            company_name: { type: Type.STRING },
            reporting_year: { type: Type.STRING },
            currency: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  current_year: { type: Type.NUMBER },
                  previous_year: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["label", "current_year", "previous_year", "unit"]
              }
            },
            investor_summary: { type: Type.STRING },
            invest_conclusion: { type: Type.STRING }
          },
          required: ["is_financial_statement", "company_name", "metrics", "invest_conclusion", "investor_summary"]
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    
    const parsedData = JSON.parse(text) as FinancialData;
    
    // Final check to ensure we have valid strings for potential .includes calls
    if (!parsedData.invest_conclusion) parsedData.invest_conclusion = "NO - DATA INCOMPLETE";
    
    return parsedData;
  } catch (err: any) {
    console.error("AI Service Error:", err);
    throw new Error(err.message || "Failed to process document");
  }
};
