import Papa from 'papaparse';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import logo from './assets/logo-awa.png';
import { 
    convertColor, 
    createSVG,
    convertSVGToBase64,
    base64ToUint8Array,
    fitTextSize,
    maxWidth,
    maxHeight, 
    numberPagesPerSVG, 
    columnSpace 
} from './utils';

export const savePDFWithMultiplePages = async (svgPages, filename, zip) => {
    const pdfDoc = await PDFDocument.create();
    const logoBytes = await fetch(logo).then(res => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoBytes);

    for (const svg of svgPages) {
        const base64Image = await convertSVGToBase64(svg);
        const imageBytes = base64ToUint8Array(base64Image.split(',')[1]);
        const image = await pdfDoc.embedPng(imageBytes);

        const page = pdfDoc.addPage([maxWidth + 20, maxHeight + 80]); // Use maxWidth and maxHeight for page size

        // Header: Logo
        page.drawImage(logoImage, {
            x: 10,
            y: maxHeight + 50,
            width: 100,
            height: 20
        });

        // SVG
        page.drawImage(image, {
            x: 10,
            y: 40,
            width: maxWidth,
            height: maxHeight,
        });

        // Footer: Draw the signature text at the bottom center
        const footerText1 = '_________________________';
        const footerText2 = 'Client Signature';
        const textFontSize = 8;
        page.drawText(footerText1, {
            x: (maxWidth - measureTextPDF(footerText1, textFontSize).width),
            y: 20,
            size: textFontSize,
        });
        page.drawText(footerText2, {
            x: (maxWidth - measureTextPDF(footerText2, textFontSize).width),
            y: 10,
            size: textFontSize,
        });
    }

    const pdfBytes = await pdfDoc.save();
    zip.file(filename, new Blob([pdfBytes], { type: 'application/pdf' }));
};

// Function to measure text dimensions
export const measureTextPDF = (text, fontSize) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px Arial`;
    const width = context.measureText(text).width;
    const textMetrics = context.measureText(text);
    const height = Math.max(fontSize, textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
    return { width, height };
};

export const generateCombinedPDF = async (labels, baseFilename, zip) => {
    let svgPages = [];
    let currentX = 0, currentY = 0, columnWidth = 0, threshold = 1;
    const columnThreshold = maxWidth / numberPagesPerSVG;
    let svg = createSVG(); // Start with an empty SVG

    for (const label of labels) {
        const { width, height, text_color, background_color, first_text_line, first_text_size, second_text_line, second_text_size } = label;

        const padding = 2;

        if (currentY + height > maxHeight) {
            currentY = 0;
            if (currentX + columnWidth >= columnThreshold * threshold) {
                currentX += columnSpace;
                threshold += 1;
            }
            currentX += columnWidth;
            columnWidth = 0;
        }

        if (currentX + width > maxWidth) {
            svgPages.push(svg);
            svg = createSVG(); // Create a new SVG for the next page
            currentX = 0;
            currentY = 0;
            columnWidth = 0;
            threshold = 1;
        }

        svg.append("rect")
            .attr("x", `${currentX}mm`)
            .attr("y", `${currentY}mm`)
            .attr("width", `${width}mm`)
            .attr("height", `${height}mm`)
            .attr("fill", convertColor(background_color))
            .attr("stroke", "white")
            .attr("stroke-width", 1);

        const adjustedFirstTextSize = fitTextSize(first_text_line, width, height, padding, first_text_size || height);
        const adjustedSecondTextSize = second_text_line ? fitTextSize(second_text_line, width, height, padding, second_text_size || height) : null;
        const spaceMultipleText = 10;
        const offsetWidth = 0.3;
        const offsetHeight = 0.9;

        let totalTextHeight = adjustedFirstTextSize;
        let firstTextY, secondTextY;
        if (adjustedSecondTextSize) {
            totalTextHeight += adjustedSecondTextSize + spaceMultipleText;
            firstTextY = currentY + height / 2 - totalTextHeight / 2 + 10;
            secondTextY = firstTextY + adjustedFirstTextSize + spaceMultipleText;
        } else {
            firstTextY = currentY + height / 2 + offsetHeight;
        }

        svg.append("text")
            .attr("x", `${currentX + width / 2}mm`)
            .attr("y", `${firstTextY}mm`) 
            .attr("font-family", "Arial") 
            .attr("font-size", `${adjustedFirstTextSize}mm`)
            .attr("font-weight", "bold")
            .attr("fill", convertColor(text_color))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text(first_text_line);

        if (adjustedSecondTextSize) {
            svg.append("text")
                .attr("x", `${currentX + width / 2}mm`)
                .attr("y", `${secondTextY}mm`) 
                .attr("font-family", "Arial") 
                .attr("font-size", `${adjustedSecondTextSize}mm`)
                .attr("font-weight", "bold")
                .attr("fill", convertColor(text_color))
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(second_text_line);
        }

        currentY += height;
        columnWidth = Math.max(columnWidth, width);
    }

    // Add the last SVG if there are any
    if (svg) {
        svgPages.push(svg);
    }

    // Save the PDF with the generated SVG pages
    await savePDFWithMultiplePages(svgPages, `${baseFilename}.pdf`, zip);
};

export const processCSV = (csvData, callback) => {
    const labels = [];
    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            results.data.forEach(row => {
                const labelWidth = parseInt(row['labelWidth (mm)'].trim()) || 0;
                const labelHeight = parseInt(row['labelHeight (mm)'].trim()) || 0;
                const textColor = row['textColor'].trim() || 'black';
                const backgroundColor = row['backgroundColor'].trim() || 'black';
                const quantity = parseInt(row['quantity'].trim()) || 0;
                const firstTextLine = row['FirstTextLine'].trim() || '';
                const firstTextSize = parseInt(row['FirstTextSize'].trim()) || null;
                const secondTextLine = row['SecondTextLine'].trim() || '';
                const secondTextSize = parseInt(row['SecondTextSize'].trim()) || firstTextSize;

                for (let i = 0; i < quantity; i++) {
                    labels.push({
                        width: labelWidth,
                        height: labelHeight,
                        text_color: textColor,
                        background_color: backgroundColor,
                        first_text_line: firstTextLine,
                        first_text_size: firstTextSize,
                        second_text_line: secondTextLine,
                        second_text_size: secondTextSize
                    });
                }
            });

            const labelsGrouped = labels.reduce((acc, label) => {
                const key = `${label.text_color}_${label.background_color}`;
                acc[key] = acc[key] || [];
                acc[key].push(label);
                return acc;
            }, {});

            const zip = new JSZip();

            const processGroup = async (key) => {
                const [textColor, backgroundColor] = key.split('_');
                const baseFilename = `combined_labels_${textColor}_${backgroundColor}.pdf`;

                // Generate the PDF for this group
                await generateCombinedPDF(labelsGrouped[key], baseFilename, zip);
            };

            // Create PDFs for all groups and add them to the zip
            await Promise.all(Object.keys(labelsGrouped).map(processGroup));

            zip.generateAsync({ type: 'blob' }).then((content) => {
                const date = new Date();
                const zipFilename = `PDF_labels_${date.toJSON().slice(0,10)}--${date.getHours()}-${date.getMinutes()}.zip`;
                const a = document.createElement('a');
                const url = URL.createObjectURL(content);
                a.href = url;
                a.download = zipFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (callback) callback();
            });
        }
    });
};
