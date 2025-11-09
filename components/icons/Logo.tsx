import React from 'react';

export const logoSvgDataUri = `data:image/svg+xml,%3csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='logoGradient' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'%3e%3cstop stop-color='%23F000B8'/%3e%3cstop offset='1' stop-color='%239D00FF'/%3e%3c/linearGradient%3e%3c/defs%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' font-family='Inter, sans-serif' font-weight='800' fill='url(%23logoGradient)'%3eDF%3c/text%3e%3c/svg%3e`;

export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
    <img src={logoSvgDataUri} alt="DevFreelancer Logo" {...props} />
);