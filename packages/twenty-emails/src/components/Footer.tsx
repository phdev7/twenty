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
        {/*
          Privacy and Terms links were removed because neither page exists:
          both URLs redirected to the app. A broken link to a privacy policy is
          worse than no link, because it claims one is published. Put them back
          the moment those pages are written.
        */}
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
