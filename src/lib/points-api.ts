export interface AllocationRequest {
  memberId: string;
  points: number;
  reason: string;
}

export interface PointsApiClient {
  /**
   * Credits points to a member. The points API does not de-duplicate requests:
   * two calls with the same request credit the points twice.
   */
  allocate(request: AllocationRequest): Promise<{ allocationId: string }>;
}

export function httpPointsApiClient(baseUrl: string, apiKey: string): PointsApiClient {
  return {
    async allocate(request) {
      const response = await fetch(`${baseUrl}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`Points API request failed: HTTP ${response.status}`);
      }
      return (await response.json()) as { allocationId: string };
    },
  };
}
