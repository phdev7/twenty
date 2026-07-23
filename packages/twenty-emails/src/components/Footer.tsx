import { type I18n } from '@lingui/core';
import { Column, Container, Row } from '@react-email/components';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  return (
    <Container style={footerContainerStyle}>
      <Row>
        <Column>
          <ShadowText>
            <Link
              href="https://bydiex.com/"
              value={i18n._('Website')}
              aria-label={i18n._("Visit Diex's website")}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="mailto:contato@bydiex.com"
              value={i18n._('Support')}
              aria-label={i18n._('Contact Diex support')}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="https://crm.bydiex.com/privacy-policy"
              value={i18n._('Privacy')}
              aria-label={i18n._("Read Diex's privacy policy")}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="https://crm.bydiex.com/terms-of-service"
              value={i18n._('Terms')}
              aria-label={i18n._("Read Diex's terms of service")}
            />
          </ShadowText>
        </Column>
      </Row>
      <ShadowText>
        <>
          {i18n._('Diex CRM')}
          <br />
          {i18n._('contato@bydiex.com')}
        </>
      </ShadowText>
    </Container>
  );
};
