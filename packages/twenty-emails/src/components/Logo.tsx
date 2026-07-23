import { Img } from '@react-email/components';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src="https://crm.bydiex.com/favicon.svg"
      alt="Diex CRM logo"
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
