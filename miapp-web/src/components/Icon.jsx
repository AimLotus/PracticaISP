import React from 'react';

export default function Icon({ name, sx = {}, className = '', ...props }) {
  const style = {
    fontSize: sx.fontSize || 24,
    color: sx.color || 'inherit',
    marginRight: sx.mr ? `px` : undefined,
    marginLeft: sx.ml ? `px` : undefined,
    marginTop: sx.mt ? `px` : undefined,
    marginBottom: sx.mb ? `px` : undefined,
    ...sx,
  };

  return (
    <span
      className={`material-icons `}
      style={style}
      {...props}
    >
      {name}
    </span>
  );
}
