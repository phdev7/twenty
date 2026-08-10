import { useCallback, useEffect, useState } from 'react';

import {
  type DiexPublicAccessRequestAvailability,
  type DiexPublicAccessRequestInput,
  type DiexPublicAccessRequestResult,
} from '@/diex-access-requests/types/diexPublicAccessRequestTypes';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const PUBLIC_ACCESS_REQUEST_ENDPOINT = `${REACT_APP_SERVER_BASE_URL}/diex/access-requests`;

const readResult = async (
  response: Response,
): Promise<DiexPublicAccessRequestResult> => {
  const body =
    (await response.json()) as Partial<DiexPublicAccessRequestResult>;

  return {
    accepted: body.accepted === true,
    message:
      typeof body.message === 'string'
        ? body.message
        : 'Não foi possível enviar a solicitação.',
  };
};

export const useDiexPublicAccessRequest = () => {
  const [availability, setAvailability] =
    useState<DiexPublicAccessRequestAvailability>('LOADING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DiexPublicAccessRequestResult | null>(
    null,
  );

  const checkAvailability = useCallback(async (): Promise<void> => {
    setAvailability('LOADING');

    try {
      const response = await fetch(PUBLIC_ACCESS_REQUEST_ENDPOINT, {
        method: 'GET',
      });

      setAvailability(
        response.ok
          ? 'AVAILABLE'
          : response.status === 404
            ? 'NOT_FOUND'
            : 'ERROR',
      );
    } catch {
      setAvailability('ERROR');
    }
  }, []);

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  const submit = useCallback(
    async (input: DiexPublicAccessRequestInput): Promise<void> => {
      setIsSubmitting(true);
      setResult(null);

      try {
        const response = await fetch(PUBLIC_ACCESS_REQUEST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (response.status === 404) {
          setAvailability('NOT_FOUND');
          return;
        }

        setResult(await readResult(response));
      } catch {
        setResult({
          accepted: false,
          message: 'Não foi possível enviar agora. Tente novamente.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    availability,
    isSubmitting,
    result,
    checkAvailability,
    submit,
  };
};
