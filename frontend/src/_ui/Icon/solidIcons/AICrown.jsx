import React from 'react';

const AICrown = ({ className = '', fill = '#FCA23F', width = '40', height = '41', ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M36.6169 16.3861L33.2402 31.8226C33.0472 32.9321 32.0342 33.7522 30.9247 33.7522H9.07232C7.91457 33.7522 6.94979 32.9321 6.75683 31.8226L3.38008 16.4343C3.13889 15.1318 4.00719 13.9258 5.30965 13.6847C6.12972 13.5399 6.94979 13.8294 7.52866 14.4565L12.5455 19.8593L17.8519 7.8477C18.3825 6.64172 19.8297 6.11109 20.9874 6.68996C21.518 6.93116 21.904 7.31707 22.1452 7.8477L27.4515 19.811L32.4684 14.4082C33.3367 13.4435 34.8321 13.347 35.8451 14.2153C36.4722 14.7459 36.7617 15.6142 36.6169 16.3861Z"
        fill={fill}
      />
    </svg>
  );
};

export default AICrown;
