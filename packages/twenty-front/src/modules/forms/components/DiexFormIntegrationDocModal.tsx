import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const StyledModal = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[6]};
  max-width: 750px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledCodeBox = styled.pre`
  background: #151515;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px 16px;
  color: #69f0ae;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
`;

export const DiexFormIntegrationDocModal = ({
  formId,
  formSlug,
  onClose,
}: {
  formId: string;
  formSlug: string;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'wordpress' | 'framer' | 'saas'>('html');
  const baseUrl = window.location.origin;
  const submitUrl = `${baseUrl}/api/v1/public/forms/${formId}/submit`;

  const htmlCode = `<form action="${submitUrl}" method="POST">
  <label>Nome Completo:</label>
  <input type="text" name="name" required />

  <label>E-mail:</label>
  <input type="email" name="email" required />

  <label>WhatsApp / Telefone:</label>
  <input type="text" name="phone" />

  <button type="submit">Enviar para o CRM</button>
</form>`;

  const wordpressCode = `// Adicione este trecho no functions.php do seu tema WordPress ou via plugin de Webhook
add_action('elementor_pro/forms/new_record', function($record, $handler) {
    $raw_fields = $record->get('fields');
    $fields = [];
    foreach ($raw_fields as $id => $field) {
        $fields[$id] = $field['value'];
    }

    wp_remote_post('${submitUrl}', [
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => json_encode($fields),
    ]);
}, 10, 2);`;

  const framerCode = `// Framer / React Component
export async function sendLeadToDiexCRM(data) {
  const response = await fetch("${submitUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}`;

  return (
    <StyledOverlay onClick={onClose}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Documentação Pública de Integração de Leads</h2>
          <Button title="Fechar" onClick={onClose} />
        </div>

        <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>
          Formulário: <strong>{formSlug}</strong> (ID: {formId})
        </p>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
          <Button
            title="HTML / Fetch JS"
            onClick={() => setActiveTab('html')}
            variant={activeTab === 'html' ? 'primary' : 'secondary'}
          />
          <Button
            title="WordPress / Elementor"
            onClick={() => setActiveTab('wordpress')}
            variant={activeTab === 'wordpress' ? 'primary' : 'secondary'}
          />
          <Button
            title="Framer / React"
            onClick={() => setActiveTab('framer')}
            variant={activeTab === 'framer' ? 'primary' : 'secondary'}
          />
          <Button
            title="Cal.com & Yayforms (SaaS)"
            onClick={() => setActiveTab('saas')}
            variant={activeTab === 'saas' ? 'primary' : 'secondary'}
          />
        </div>

        {activeTab === 'html' && (
          <div>
            <h4>Código HTML & JS Prontos para Copiar</h4>
            <StyledCodeBox>{htmlCode}</StyledCodeBox>
          </div>
        )}

        {activeTab === 'wordpress' && (
          <div>
            <h4>Integração Nativa WordPress & Elementor Webhook</h4>
            <p style={{ color: '#aaa', fontSize: '13px' }}>
              Cole a URL abaixo nas configurações de Ações Após o Envio (*Webhooks*) do Elementor ou insira o PHP abaixo:
            </p>
            <StyledCodeBox>{submitUrl}</StyledCodeBox>
            <StyledCodeBox>{wordpressCode}</StyledCodeBox>
          </div>
        )}

        {activeTab === 'framer' && (
          <div>
            <h4>Componente de Código Framer & Webflow</h4>
            <StyledCodeBox>{framerCode}</StyledCodeBox>
          </div>
        )}

        {activeTab === 'saas' && (
          <div>
            <h4>Conectores de Webhook para Cal.com, Yayforms, Typeform e Tally</h4>
            <p style={{ color: '#aaa', fontSize: '13px' }}>
              No seu SaaS de agendamento ou formulários, cadastre a seguinte URL de Webhook:
            </p>
            <StyledCodeBox>{`${baseUrl}/api/v1/webhooks/connectors/cal-com`}</StyledCodeBox>
          </div>
        )}
      </StyledModal>
    </StyledOverlay>
  );
};
