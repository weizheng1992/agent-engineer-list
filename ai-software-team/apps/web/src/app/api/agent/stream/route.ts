import { NextRequest } from "next/server";
import { graph } from "@ai-software-team/graph";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const requirement = reqUrl.searchParams.get("req") || "Build simple app";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent("status", { message: "Initializing LangGraph..." });

        // Invoke initial state values through Graph foundation
        const inputs = {
          requirement,
          currentStep: "init",
          iterationCount: 0,
        };

        const eventStream = await graph.stream(inputs, {
          streamMode: "updates"
        });

        for await (const chunk of eventStream) {
          // Send active updates down the SSE stream
          sendEvent("update", chunk);
        }

        sendEvent("complete", { message: "Workflow finished successfully." });
      } catch (error: any) {
        sendEvent("error", { message: error?.message || "Internal server error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
