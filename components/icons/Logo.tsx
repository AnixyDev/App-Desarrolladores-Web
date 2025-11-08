import React from 'react';

export const logoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABeElEQVRYR+2WvUoDQRSGv0uSFFsLK4WdYGFhI/gBFgqLsbXwFhY+Ql9DsBEs/Au2Fja2fhBFEUEkL25uL7s5u8uCIJ3lbu7ce+Zm584+hGGaI41kJHMAgYVcwgQUx/MEYAWMAPfW9wDgevANWAE+ge/M2YV6APwDNsAtcO/1sAI8Aq+AnRC/BbgGngK/wG2yF2kM+Ab8AX4A/6V/DngFTsK35I5T0DtwEbyJ7nEw2nQBPAX3yR6jIg7gJrgT3eNY1NUA/A0uRJdYlC0AeA+ukllkUXYB4Am4Jb3G4mwtwDtwSwaNQlYAVsBtaTQTWQMYA25JZ/GYVQDXwG1pNRZZBXAF3JbB4zGHAOrALWk2FlkAWAF3pZ94zAHAceBW+ovFHAJuha/pDFYWYAg4FV3j8JSLAe4Cx6KbbMwiAATggaQ1WUYB0B1wRFrNRRaA7sAnkdbYJAXAW3BF2gxH/wCv8w9/AM2J8zLw3b0+AAAAAElFTkSuQmCC";

export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
    <img src={logoPngDataUri} alt="DevFreelancer Logo" {...props} />
);