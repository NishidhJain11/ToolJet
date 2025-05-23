import React from 'react';

const CloseIcon = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg width={width} height={width} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.80846 9.02634L14.0896 15.3092L15.3093 14.0912L9.02645 7.80836L15.3093 1.5272L14.0913 0.307495L7.80846 6.59037L1.52731 0.307495L0.309326 1.5272L6.59048 7.80836L0.309326 14.0895L1.52731 15.3092L7.80846 9.02634Z"
      fill="#61656F"
    />
  </svg>
);

export default CloseIcon;
