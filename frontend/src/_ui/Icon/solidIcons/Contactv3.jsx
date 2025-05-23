import React from 'react';

const Contactv3 = ({ className = '', fill = '#CCD1D5', width = '16', height = '16', ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.9987 2C2.52594 2 1.33203 3.19391 1.33203 4.66667V11.3333C1.33203 12.8061 2.52594 14 3.9987 14H11.9987C13.4715 14 14.6654 12.8061 14.6654 11.3333V4.66667C14.6654 3.19391 13.4715 2 11.9987 2H3.9987ZM4.27605 4.91728C4.04629 4.7641 3.73585 4.82619 3.58267 5.05595C3.4295 5.28572 3.49159 5.59615 3.72135 5.74933L6.24215 7.42986C7.30583 8.13898 8.69157 8.13898 9.75525 7.42986L12.2761 5.74933C12.5058 5.59615 12.5679 5.28572 12.4147 5.05595C12.2615 4.82619 11.9511 4.7641 11.7214 4.91728L9.20055 6.59781C8.47277 7.083 7.52463 7.083 6.79685 6.59781L4.27605 4.91728Z"
        fill={fill}
      />
    </svg>
  );
};

export default Contactv3;
