import { useAuth } from '@/auth/hooks/useAuth';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useRedirectToWorkspaceDomain } from '@/domain-manager/hooks/useRedirectToWorkspaceDomain';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { AppPath } from 'diex-shared/types';
import { useMutation } from '@apollo/client/react';
import {
  SignUpInNewWorkspaceDocument,
  UploadNewWorkspaceLogoDocument,
} from '~/generated-metadata/graphql';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';
import { assertIsDefinedOrThrow, isDefined } from 'diex-shared/utils';
import { useLingui } from '@lingui/react/macro';

export const useSignUpInNewWorkspace = () => {
  const { redirectToWorkspaceDomain } = useRedirectToWorkspaceDomain();
  const { getAuthTokensFromLoginToken } = useAuth();
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const { enqueueErrorSnackBar } = useSnackBar();
  const { t } = useLingui();

  const [signUpInNewWorkspaceMutation] = useMutation(
    SignUpInNewWorkspaceDocument,
  );
  const [uploadNewWorkspaceLogoMutation] = useMutation(
    UploadNewWorkspaceLogoDocument,
  );

  const createWorkspace = async ({
    displayName,
    subdomain,
    logo,
    whatsapp,
    companyDescription,
    idealCustomerProfile,
    toneOfVoice,
    primaryGoal,
    companySize,
    currentProcess,
  }: {
    displayName?: string;
    subdomain?: string;
    logo?: File;
    whatsapp: string;
    companyDescription: string;
    idealCustomerProfile: string;
    toneOfVoice: string;
    primaryGoal: string;
    companySize: string;
    currentProcess: string;
  }): Promise<boolean> => {
    try {
      const { data } = await signUpInNewWorkspaceMutation({
        variables: {
          input: {
            displayName,
            subdomain,
            whatsapp,
            companyDescription,
            idealCustomerProfile,
            toneOfVoice,
            primaryGoal,
            companySize,
            currentProcess,
          },
        },
      });
      assertIsDefinedOrThrow(data?.signUpInNewWorkspace);

      const workspaceId = data.signUpInNewWorkspace.workspace.id;

      if (isDefined(logo)) {
        try {
          await uploadNewWorkspaceLogoMutation({
            variables: { workspaceId, file: logo },
          });
        } catch (logoUploadError) {
          enqueueErrorSnackBar(
            CombinedGraphQLErrors.is(logoUploadError)
              ? { apolloError: logoUploadError }
              : {
                  message:
                    logoUploadError instanceof Error
                      ? logoUploadError.message
                      : t`Workspace logo upload failed`,
                },
          );
        }
      }

      const loginToken = data.signUpInNewWorkspace.loginToken.token;

      if (!isMultiWorkspaceEnabled) {
        await getAuthTokensFromLoginToken(loginToken);
        return true;
      }

      await redirectToWorkspaceDomain(
        getWorkspaceUrl(data.signUpInNewWorkspace.workspace.workspaceUrls),
        AppPath.Verify,
        { loginToken },
        '_self',
      );

      return true;
    } catch (error) {
      enqueueErrorSnackBar(
        CombinedGraphQLErrors.is(error)
          ? { apolloError: error }
          : {
              message:
                error instanceof Error
                  ? error.message
                  : t`Workspace creation failed`,
            },
      );

      return false;
    }
  };

  return {
    createWorkspace,
  };
};
