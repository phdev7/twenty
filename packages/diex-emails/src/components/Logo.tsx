import { Img } from '@react-email/components';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    // crm.bydiex.com is the static landing, which 302s everything but its own
    // page, and a mail client will not follow a redirect for an image. The app
    // host serves the brand assets directly at 200.
    <Img
      src="https://app.crm.bydiex.com/images/brand/logomark.svg"
      alt="Diex CRM logo"
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
