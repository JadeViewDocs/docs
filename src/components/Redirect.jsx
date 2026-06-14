import { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function RedirectInner({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

export default function Redirect({ to }) {
  return (
    <BrowserOnly>
      {() => <RedirectInner to={to} />}
    </BrowserOnly>
  );
}
