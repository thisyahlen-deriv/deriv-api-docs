import React, { useEffect } from 'react';
import axios from 'axios';
import { getAccountsFromSearchParams } from '@site/src/utils';
import useAuthContext from '@site/src/hooks/useAuthContext';

export default function CallbackComponent() {
  const { updateLoginAccounts } = useAuthContext();
  const [error, setError] = React.useState<string | null>(null);
  const [error_description, setErrorDescription] = React.useState<string | null>(null);

  const urlParams = new URLSearchParams(window?.location?.search);

  const code = urlParams.get('code');
  const state = urlParams.get('state');

  const oidc_endpoints = localStorage.getItem('config.oidc_endpoints');

  const token_endpoint = JSON.parse(oidc_endpoints).token_endpoint;

  useEffect(() => {
    const navbar = document.querySelector('.navbar.navbar--fixed-top') as HTMLElement;
    if (navbar) navbar.style.display = 'none';

    const exchangeToken = async () => {
      try {
        const oidc_key = `oidc.${state}`;

        const oidc_data = localStorage.getItem(oidc_key);
        const code_verifier = oidc_data ? JSON.parse(oidc_data).code_verifier : null;
        const appId = localStorage.getItem('config.app_id');

        if (!code_verifier) return;

        const response = await fetch(token_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            redirect_uri: `${window.location.origin}/callback`,
            code: code,
            code_verifier: code_verifier,
            client_id: appId,
          }).toString(),
        });

        const data = await response.json();
        if (response.ok) {
          // Handle the access token here (e.g., save it or use it in further API calls)
          localStorage.setItem('id_token', data.id_token);

          try {
            const response = await axios.post(
              'https://qa101.deriv.dev/oauth2/legacy/tokens',
              {},
              {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            const legacyData = response.data;
            const accounts = getAccountsFromSearchParams(legacyData);
            updateLoginAccounts(accounts);
            window.location.href = '/dashboard';
            // You can store or handle the legacy tokens as needed here
          } catch (error) {
            if (error.response) {
              const legacyData = error.response.data;
              console.error('Error fetching legacy tokens:', legacyData);
              setError(legacyData.error);
              setErrorDescription(legacyData.error_description);
            } else {
              console.error('Failed to fetch legacy tokens:', error);
            }
          }
        } else {
          console.error('Error exchanging token:', data);
          setError(data.error);
          setErrorDescription(data.error_description);
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
      }
    };

    exchangeToken();
  }, [code, state, token_endpoint, updateLoginAccounts]);

  return (
    <>
      {error && <p style={{ fontSize: '2rem', textAlign: 'center', color: 'red' }}>{error}</p>}
      {error_description && (
        <p style={{ fontSize: '1.5rem', textAlign: 'center', color: 'red' }}>{error_description}</p>
      )}
    </>
  );
}