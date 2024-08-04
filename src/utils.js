// utils.js
import * as d3 from 'd3';

export let maxWidth = 600;
export let maxHeight = 300;
export let numberPagesPerSVG = 3;
export let columnSpace = 6;

export const convertColor = (color) => {
    const colorMap = {
        'BLACK': '#000000',
        'WHITE': '#FFFFFF',
        'TURQUOISE': '#aeddd3',
        'YELLOW': '#fce204'
    };
    return colorMap[color.toUpperCase()] || color;
};

export const createSVG = () => 
    d3.create("svg")
        .attr("width", `${maxWidth}mm`)
        .attr("height", `${maxHeight}mm`)
        .attr("xmlns", "http://www.w3.org/2000/svg");

export const convertSVGToBase64 = async (svg) => {
    const svgData = svg.node().outerHTML;
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            URL.revokeObjectURL(svgUrl);
        };
        img.onerror = reject;
        img.src = svgUrl;
    });
};

export const updateSettings = (settings) => {
    maxWidth = parseInt(settings.maxWidth) || 600;
    maxHeight = parseInt(settings.maxHeight) || 300;
    numberPagesPerSVG = parseInt(settings.numberPagesPerSVG) || 3;
    columnSpace = parseInt(settings.columnSpace) || 6;
};

export const base64ToUint8Array = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Function to fit text into a specified width and height with padding
export const fitTextSize = (text, rectWidth, rectHeight, padding, initialFontSize) => {
    const availableWidth = rectWidth - padding;
    const availableHeight = rectHeight - padding;
    let fontSize = initialFontSize;
    let textMetrics = measureText(text, fontSize);

    console.log(text,fontSize);
    // Adjust font size based on width
    while (textMetrics.width > availableWidth && fontSize > 0) {
        fontSize -= 0.5;
        textMetrics = measureText(text, fontSize);
    }

    console.log(text,fontSize);

    // Adjust font size based on height
    while (textMetrics.height > availableHeight && fontSize > 0) {
        fontSize--;
        textMetrics = measureText(text, fontSize);
    }

    console.log(text,fontSize);

    return fontSize;
};

export const measureText = (text, fontSize) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px Arial`;
    const width = context.measureText(text).width;
    const textMetrics = context.measureText(text);
    const height = Math.max(fontSize, textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
    return { width, height };
};