import OpenAI from "openai";
import { businessProfile } from "../../../lib/business-profile";
import {generateQuotation} from "../../../lib/business-task";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ROUNDS = 4;

const tools = [

  {
  type: "function",
  name: "generate_quotation",
  description:
    "Generate a draft business quotation when a customer requests a price quotation.",
  parameters: {
    type: "object",
    properties: {
      businessName: {
        type: "string",
      },
      customerName: {
        type: "string",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            productName: {
              type: "string",
            },
            quantity: {
              type: "integer",
            },
            unitPrice: {
              type: "number",
            },
          },
          required: ["productName", "quantity", "unitPrice"],
          additionalProperties: false,
        },
      },
      discountPercent: {
        type: "number",
      },
    },
    required: [
      "businessName",
      "customerName",
      "items",
      "discountPercent",
    ],
    additionalProperties: false,
  },
  strict: true,
},
  {
    type: "function",
    name: "calculate_line_total",
    description: "Calculate the total product cost.",
    parameters: {
      type: "object",
      properties: {
        quantity: { type: "number" },
        unit_price: { type: "number" },
      },
      required: ["quantity", "unit_price"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "calculate_discount",
    description: "Calculate a discount and the final price.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number" },
        discount_percent: { type: "number" },
      },
      required: ["amount", "discount_percent"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "calculate_profit",
    description: "Calculate gross profit and gross profit margin.",
    parameters: {
      type: "object",
      properties: {
        quantity: { type: "number" },
        selling_price: { type: "number" },
        cost_price: { type: "number" },
      },
      required: ["quantity", "selling_price", "cost_price"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "calculate_tax",
    description: "Calculate tax using a tax rate explicitly provided by the user or business profile.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number" },
        tax_rate_percent: { type: "number" },
      },
      required: ["amount", "tax_rate_percent"],
      additionalProperties: false,
    },
    strict: true,
  },
];

function validateMoney(value) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1000000000000
  ) {
    throw new Error("Invalid monetary value.");
  }
}

function validateQuantity(quantity) {
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > 1000000
  ) {
    throw new Error("Invalid quantity.");
  }
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateLineTotal(quantity, unitPrice) {
  validateQuantity(quantity);
  validateMoney(unitPrice);

  return {
    quantity,
    unit_price: unitPrice,
    total: roundMoney(quantity * unitPrice),
    currency: "XAF",
  };
}

function calculateDiscount(amount, discountPercent) {
  validateMoney(amount);

  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    throw new Error("Invalid discount percentage.");
  }

  const discount = roundMoney(amount * discountPercent / 100);

  return {
    original_amount: amount,
    discount_percent: discountPercent,
    discount,
    final_amount: roundMoney(amount - discount),
    currency: "XAF",
  };
}

function calculateProfit(quantity, sellingPrice, costPrice) {
  validateQuantity(quantity);
  validateMoney(sellingPrice);
  validateMoney(costPrice);

  const revenue = quantity * sellingPrice;
  const totalCost = quantity * costPrice;
  const grossProfit = revenue - totalCost;

  return {
    quantity,
    revenue: roundMoney(revenue),
    total_cost: roundMoney(totalCost),
    gross_profit: roundMoney(grossProfit),
    gross_profit_margin:
      revenue > 0
        ? roundMoney((grossProfit / revenue) * 100)
        : null,
    currency: "XAF",
  };
}

function calculateTax(amount, taxRatePercent) {
  validateMoney(amount);

  if (
    !Number.isFinite(taxRatePercent) ||
    taxRatePercent < 0 ||
    taxRatePercent > 100
  ) {
    throw new Error("Invalid tax rate.");
  }

  const tax = roundMoney(amount * taxRatePercent / 100);

  return {
    amount,
    tax_rate_percent: taxRatePercent,
    tax,
    total_including_tax: roundMoney(amount + tax),
    currency: "XAF",
  };
}

function executeTool(name, args) {
  switch (name) {
    case "generate_quotation":
      return generateQuotation({
        businessName: args.businessName,
        customerName: args.customerName,
        items: args.items,
        discountPercent: args.discountPercent,
      });
    case "calculate_line_total":
      return calculateLineTotal(
        args.quantity,
        args.unit_price
      );

    case "calculate_discount":
      return calculateDiscount(
        args.amount,
        args.discount_percent
      );

    case "calculate_profit":
      return calculateProfit(
        args.quantity,
        args.selling_price,
        args.cost_price
      );

    case "calculate_tax":
      return calculateTax(
        args.amount,
        args.tax_rate_percent
      );

    default:
      throw new Error("Unknown tool.");
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;
    const rawHistory = body.history ?? [];

    // Validate the current message.
    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return Response.json(
        {
          success: false,
          error: "Enter a message containing 1 to 4000 characters.",
        },
        { status: 400 }
      );
    }

    // Validate history before using it.
    if (
      !Array.isArray(rawHistory) ||
      rawHistory.length > MAX_MESSAGES
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid conversation history.",
        },
        { status: 400 }
      );
    }

    const validHistory = rawHistory.every(
      (item) =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.trim().length > 0 &&
        item.content.length <= 2000
    );

    if (!validHistory) {
      return Response.json(
        {
          success: false,
          error: "Conversation history contains invalid messages.",
        },
        { status: 400 }
      );
    }

    const inputList = [
      ...rawHistory.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user",
        content: message.trim(),
      },
    ];

    const instructions = `
You are AgentFlow, a professional business assistant.

Business profile:
${JSON.stringify(businessProfile, null, 2)}

Rules:
- When generating a quotation, include every item returned by the quotation tool.
- Never omit product names, quantities, unit prices or line totals.
- Present the quotation as a readable Markdown table.
- Do not invent missing quotation details.
- Use generate_quotation when a customer requests a quotation.
- Never invent product prices. Ask for missing prices.
- Quotations must remain drafts until approved.
- Answer using the business profile.
- Never invent business information.
- Use the appropriate calculation tool when needed.
- Do not guess tax rates. Ask for the rate if it is missing.
- Explain calculation results accurately.
- Gross profit is not the same as net profit.
- Never claim an action was completed without confirmation.
- Protect confidential business information.
- Be professional and concise.
`;

    let response;

    // Allow multiple rounds of tool execution.
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions,
        input: inputList,
        tools,
      });

      const functionCalls = response.output.filter(
        (item) => item.type === "function_call"
      );

      if (functionCalls.length === 0) {
        break;
      }

      // Preserve the model's output.
      inputList.push(...response.output);

      // Execute every requested tool.
      for (const call of functionCalls) {
        let result;

        try {
          const args = JSON.parse(call.arguments);
          result = executeTool(call.name, args);
        } catch (error) {
          result = {
            success: false,
            error: "The requested calculation could not be completed.",
          };
        }

        inputList.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    // Do not return an unfinished tool call as a final answer.
    if (
      response.output.some(
        (item) => item.type === "function_call"
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "The agent reached its tool execution limit.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      reply: response.output_text,
    });
  } catch (error) {
    console.error("AI Agent Error:", error);

    return Response.json(
      {
        success: false,
        error: "The AI could not generate a reply. Check the server terminal.",
      },
      { status: 500 }
    );
  }
}