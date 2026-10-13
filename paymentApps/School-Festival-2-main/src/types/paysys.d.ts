export {};

interface PaysysTokenResponse {
  id?: string;
  error?: string;
}

declare global {
  interface Window {
    metapspayment?: {
      setRequireName: (required: boolean) => void;

      setRequireCsc: (required: boolean) => void;

      createTokenWin: (
          callback: (
            status: number,

            response: PaysysTokenResponse
          ) => void

        ) => void;
    };
  }
}
