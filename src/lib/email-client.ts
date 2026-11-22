export interface EmailRequest {
  to: string;
  template: string;
  variables: Record<string, string>;
}

export interface EmailClient {
  /** Sends a templated email. The email API does not de-duplicate requests. */
  send(request: EmailRequest): Promise<void>;
}

export function httpEmailClient(baseUrl: string, apiKey: string): EmailClient {
  return {
    async send(request) {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`Email API request failed: HTTP ${response.status}`);
      }
    },
  };
}
