import { AdvancedTextEditor } from '@/advanced-text-editor/components/AdvancedTextEditor';
import {
  type AdvancedTextEditorContentType,
  useAdvancedTextEditor,
} from '@/advanced-text-editor/hooks/useAdvancedTextEditor';
import { FormFieldInputContainer } from '@/object-record/record-field/ui/form-types/components/FormFieldInputContainer';
import { type VariablePickerComponent } from '@/object-record/record-field/ui/form-types/types/VariablePickerComponent';
import { InputHint } from '@/ui/input/components/InputHint';
import { InputLabel } from '@/ui/input/components/InputLabel';
import { useFullScreenModal } from '@/ui/layout/fullscreen/hooks/useFullScreenModal';
import { type BreadcrumbProps } from '@/ui/navigation/bread-crumb/components/Breadcrumb';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useId, useState } from 'react';
import { isDefined } from 'diex-shared/utils';
import { IconClick, IconLink, IconMaximize, IconPhoto } from 'diex-ui/icon';
import { LightIconButton } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { useIsMobile } from 'diex-ui/utilities';

const StyledAdvancedTextFieldContainerWrapper = styled.div`
  flex-grow: 1;
`;

const StyledAdvancedTextFieldFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: ${themeCssVariables.spacing[2]};
  position: relative;
`;

const StyledAdvancedTextFieldInnerContainer = styled.div`
  background-color: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;

  display: flex;
  flex-grow: 1;
  overflow: auto;
  width: 100%;
`;

const StyledEmailToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledEmailToolbarButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  height: 28px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledEditorActionButtonContainer = styled.div<{
  hasVariablePicker?: boolean;
}>`
  margin-top: ${themeCssVariables.spacing[1]};
  position: absolute;
  right: ${({ hasVariablePicker }) =>
    hasVariablePicker
      ? `calc(${themeCssVariables.spacing[7]} + ${themeCssVariables.spacing[2]})`
      : themeCssVariables.spacing[1]};
  top: ${themeCssVariables.spacing[0]};
  z-index: 1;
`;

const StyledFullScreenEditorContainer = styled.div`
  background-color: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
`;

type FormAdvancedTextFieldInputProps = {
  label?: string;
  error?: string;
  hint?: string;
  defaultValue: string | undefined | null;
  onChange: (value: string) => void;
  readonly?: boolean;
  placeholder?: string;
  VariablePicker?: VariablePickerComponent;
  onImageUpload?: (file: File) => Promise<string>;
  onImageUploadError?: (error: Error, file: File) => void;
  enableFullScreen?: boolean;
  fullScreenBreadcrumbs?: BreadcrumbProps['links'];
  minHeight: number;
  maxWidth: number;
  contentType?: AdvancedTextEditorContentType;
  emailComposerMode?: boolean;
};

export const FormAdvancedTextFieldInput = ({
  label,
  error,
  hint,
  defaultValue,
  placeholder,
  onChange,
  readonly,
  VariablePicker,
  onImageUpload,
  onImageUploadError,
  enableFullScreen = true,
  fullScreenBreadcrumbs,
  minHeight,
  maxWidth,
  contentType = 'json',
  emailComposerMode = false,
}: FormAdvancedTextFieldInputProps) => {
  const instanceId = useId();
  const isMobile = useIsMobile();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { t } = useLingui();
  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  const editor = useAdvancedTextEditor(
    {
      placeholder: placeholder,
      readonly,
      defaultValue,
      contentType,
      onUpdate: (editor) => {
        if (contentType === 'markdown' || contentType === 'html') {
          onChange(editor.getHTML());
        } else {
          const jsonContent = editor.getJSON();
          onChange(JSON.stringify(jsonContent));
        }
      },
      onFocus: () => {
        pushFocusItemToFocusStack({
          focusId: instanceId,
          component: {
            type: FocusComponentType.FORM_FIELD_INPUT,
            instanceId: instanceId,
          },
          globalHotkeysConfig: {
            enableGlobalHotkeysConflictingWithKeyboard: false,
          },
        });
      },
      onBlur: () => {
        removeFocusItemFromFocusStackById({ focusId: instanceId });
      },
      onImageUpload,
      onImageUploadError,
      enableSlashCommand: true,
    },
    [isFullScreen],
  );

  const handleEnterFullScreen = () => {
    setIsFullScreen(true);
  };

  const handleExitFullScreen = () => {
    setIsFullScreen(false);
  };

  const handleVariableTagInsert = (variableName: string) => {
    if (!isDefined(editor)) {
      throw new Error(
        'Expected the editor to be defined when a variable is selected',
      );
    }

    editor.commands.insertVariableTag(variableName);
  };

  const getAllowedUrl = (
    rawUrl: string,
    allowedProtocols: string[],
  ): string | null => {
    try {
      const parsedUrl = new URL(rawUrl);

      return allowedProtocols.includes(parsedUrl.protocol)
        ? parsedUrl.toString()
        : null;
    } catch {
      return null;
    }
  };

  const handleInsertLink = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const rawHref = window.prompt('Cole o endereço do link (https://...)');

    if (!rawHref) return;

    const href = getAllowedUrl(rawHref, ['http:', 'https:', 'mailto:']);

    if (!href) {
      window.alert(
        'Informe uma URL segura iniciada por https://, http:// ou mailto:.',
      );
      return;
    }

    if (selectedText) {
      editor.chain().focus().setLink({ href }).run();
      return;
    }

    const label = window.prompt('Texto que será exibido', 'Abrir link');

    if (!label) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: label,
        marks: [{ type: 'link', attrs: { href } }],
      })
      .run();
  };

  const handleInsertImage = () => {
    const rawSrc = window.prompt(
      'Cole a URL pública da imagem (https://...). Para arquivos, use Anexos.',
    );

    if (!rawSrc) return;

    const src = getAllowedUrl(rawSrc, ['http:', 'https:']);

    if (!src) {
      window.alert('Informe uma URL pública iniciada por https:// ou http://.');
      return;
    }

    editor.chain().focus().setImage({ src }).run();
  };

  const handleInsertButton = () => {
    const rawHref = window.prompt('Cole o endereço do botão (https://...)');

    if (!rawHref) return;

    const href = getAllowedUrl(rawHref, ['http:', 'https:']);

    if (!href) {
      window.alert('Informe uma URL segura iniciada por https:// ou http://.');
      return;
    }

    const label = window.prompt('Texto do botão', 'Saiba mais');

    if (!label) return;

    editor.chain().focus().insertEmailButton({ href, label }).run();
  };

  const defaultBreadcrumbs: BreadcrumbProps['links'] = [
    {
      children: t`Text Editor`,
    },
  ];

  const breadcrumbLinks = fullScreenBreadcrumbs || defaultBreadcrumbs;

  const { renderFullScreenModal } = useFullScreenModal({
    links: breadcrumbLinks,
    onClose: handleExitFullScreen,
    hasClosePageButton: !isMobile,
  });

  const fullScreenOverlay = enableFullScreen
    ? renderFullScreenModal(
        <div data-globally-prevent-click-outside="true">
          <StyledFullScreenEditorContainer>
            <AdvancedTextEditor
              editor={editor}
              readonly={readonly}
              minHeight={minHeight}
              maxWidth={maxWidth}
            />
          </StyledFullScreenEditorContainer>
        </div>,
        isFullScreen,
      )
    : null;

  if (!isDefined(editor)) {
    return null;
  }

  return (
    <>
      <StyledAdvancedTextFieldContainerWrapper>
        <FormFieldInputContainer>
          {label ? <InputLabel>{label}</InputLabel> : null}

          <StyledAdvancedTextFieldFieldContainer>
            {emailComposerMode && (
              <StyledEmailToolbar>
                <StyledEmailToolbarButton
                  type="button"
                  onClick={handleInsertLink}
                >
                  <IconLink size={14} />
                  Link
                </StyledEmailToolbarButton>
                <StyledEmailToolbarButton
                  type="button"
                  onClick={handleInsertButton}
                >
                  <IconClick size={14} />
                  Botão de ação
                </StyledEmailToolbarButton>
                <StyledEmailToolbarButton
                  type="button"
                  onClick={handleInsertImage}
                >
                  <IconPhoto size={14} />
                  Imagem por URL
                </StyledEmailToolbarButton>
              </StyledEmailToolbar>
            )}
            <StyledAdvancedTextFieldInnerContainer>
              {!isFullScreen && (
                <AdvancedTextEditor
                  editor={editor}
                  readonly={readonly}
                  minHeight={minHeight}
                  maxWidth={maxWidth}
                />
              )}

              {enableFullScreen && (
                <StyledEditorActionButtonContainer
                  hasVariablePicker={isDefined(VariablePicker) && !readonly}
                >
                  {!readonly && !isFullScreen && (
                    <LightIconButton
                      Icon={IconMaximize}
                      size="small"
                      onClick={handleEnterFullScreen}
                      accent="tertiary"
                    />
                  )}
                </StyledEditorActionButtonContainer>
              )}

              {VariablePicker && !readonly ? (
                <VariablePicker
                  instanceId={instanceId}
                  multiline={true}
                  onVariableSelect={handleVariableTagInsert}
                />
              ) : null}
            </StyledAdvancedTextFieldInnerContainer>
          </StyledAdvancedTextFieldFieldContainer>
          {hint && <InputHint>{hint}</InputHint>}
          {error && <InputHint danger>{error}</InputHint>}
        </FormFieldInputContainer>
      </StyledAdvancedTextFieldContainerWrapper>

      {fullScreenOverlay}
    </>
  );
};
