// svgGeneratorUtils.js
import Papa from 'papaparse';
import JSZip from 'jszip';
import { 
    convertColor, 
    createSVG,
    fitTextSize,
    maxWidth,
    maxHeight, 
    numberPagesPerSVG, 
    columnSpace } from './utils';

export const saveSVG = (svg, filename, folder) => {
    const svgData = svg.node().outerHTML;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    folder.file(filename, blob);
};

export const measureTextSVG = (text, fontSize) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px Arial`;
    const width = context.measureText(text).width;
    const textMetrics = context.measureText(text);
    const height = Math.max(fontSize, textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
    const dpi = 35;
    const heightInMm = height * (25.4 / dpi);
    return { width, height };
};

export const generateCombinedSVG = async (labels, baseFilename, folder) => {
    const columnThreshold = maxWidth / numberPagesPerSVG;
    let currentX = 0, currentY = 0, columnWidth = 0, svgCount = 1, threshold = 1;
    let svg = createSVG();

    for (const label of labels) {
        const { width, height, text_color, background_color, first_text_line, first_text_size, second_text_line, second_text_size } = label;

        const padding = 1;

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
            const svgFilename = `${baseFilename}_${svgCount}.svg`;

            saveSVG(svg, svgFilename, folder);
            
            svgCount++;
            svg = createSVG();
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
            .attr("fill", "white")
            .attr("stroke", convertColor(background_color))
            .attr("stroke-width", 1);

        const adjustedFirstTextSize = fitTextSize(first_text_line, width, height, padding, first_text_size || height);
        const adjustedSecondTextSize = second_text_line ? fitTextSize(second_text_line, width, height, padding, second_text_size || height) : null;
        const spaceMultipleText = 10;
        const offsetWidth = 0.3;
        const offsetHeight = 1.2;

        let totalTextHeight = adjustedFirstTextSize;
        let firstTextY, secondTextY;

        if (adjustedSecondTextSize) {
            totalTextHeight += adjustedSecondTextSize + spaceMultipleText;
            firstTextY = currentY + height / 2 - totalTextHeight / 2;
            secondTextY = firstTextY + adjustedFirstTextSize + spaceMultipleText;
        } else {
            firstTextY = currentY + height / 2 - offsetHeight;
        }

        svg.append("text")
            .attr("x", `${currentX + width / 2 - offsetWidth}mm`)
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
                .attr("x", `${currentX + width / 2 - offsetWidth}mm`)
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

    const svgFilename = `${baseFilename}_${svgCount}.svg`;

    saveSVG(svg, svgFilename, folder);
};

export const processCSV = (csvData, callback) => {
    const labels = [];
    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
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
                const baseFilename = `combined_labels_${textColor}_${backgroundColor}`;
                const folder = zip.folder(baseFilename);
                await generateCombinedSVG(labelsGrouped[key], baseFilename, folder);
                await generateCombinedLBRN2(labelsGrouped[key], baseFilename, folder);
            };

            Promise.all(Object.keys(labelsGrouped).map(processGroup)).then(() => {
                zip.generateAsync({ type: 'blob' }).then((content) => {
                    
                    const date = new Date();
                    const zipFilename = `SVG_labels_${date.toJSON().slice(0,10)}--${date.getHours()}-${date.getMinutes()}.zip`;
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
            });
        }
    });
};


// Generate .lbrn2 files
export const generateCombinedLBRN2 = async (labels, baseFilename, folder) => {
    const columnThreshold = maxWidth / numberPagesPerSVG;
    let currentX = 0, currentY = 0, columnWidth = 0, lbrn2Count = 1, threshold = 1;
    let lbrn2Document = document.implementation.createDocument(null, 'LightBurnProject', null);
    let projectElement = lbrn2Document.documentElement;

    // Initialize project element attributes
    projectElement.setAttribute('AppVersion', '1.6.03');
    projectElement.setAttribute('FormatVersion', '1');
    projectElement.setAttribute('MaterialHeight', '0');
    projectElement.setAttribute('MirrorX', 'True');
    projectElement.setAttribute('MirrorY', 'True');

    const addVariableText = () => {
        const variableTextElement = createElement(lbrn2Document, 'VariableText');
        variableTextElement.appendChild(createElement(lbrn2Document, 'Start', { Value: '0' }));
        variableTextElement.appendChild(createElement(lbrn2Document, 'End', { Value: '1047140' }));
        variableTextElement.appendChild(createElement(lbrn2Document, 'Current', { Value: '0' }));
        variableTextElement.appendChild(createElement(lbrn2Document, 'Increment', { Value: '1' }));
        variableTextElement.appendChild(createElement(lbrn2Document, 'AutoAdvance', { Value: '1' }));
        projectElement.appendChild(variableTextElement);
    };

    const addUIPrefs = () => {
        const uiPrefsElement = createElement(lbrn2Document, 'UIPrefs');
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ByLayer', { Value: '0' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ByGroup', { Value: '-1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ByPriority', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_WhichDirection', { Value: '0' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_InnerToOuter', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ByDirection', { Value: '0' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ReduceTravel', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_HideBacklash', { Value: '0' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ReduceDirChanges', { Value: '0' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_ChooseCorners', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_AllowReverse', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_RemoveOverlaps', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_OptimalEntryPoint', { Value: '1' }));
        uiPrefsElement.appendChild(createElement(lbrn2Document, 'Optimize_OverlapDist', { Value: '0.025' }));
        projectElement.appendChild(uiPrefsElement);
    };

    const addCutSettings = () => {
        const cutSettings = [
            {
                type: 'Cut',
                index: '4',
                name: 'C04',
                minPower: '15',
                maxPower: '15',
                maxPower2: '20',
                speed: '35',
                dotTime: '1',
                priority: '0',
                tabCount: '1',
                tabCountMax: '1'
            },
            {
                type: 'Scan',
                index: '23',
                name: 'C23',
                maxPower: '20',
                maxPower2: '20',
                speed: '2500',
                dotTime: '1',
                priority: '1',
                tabCount: '1',
                tabCountMax: '1'
            }
        ];

        cutSettings.forEach(setting => {
            const cutSettingElement = createElement(lbrn2Document, 'CutSetting', { type: setting.type });
            Object.entries(setting).forEach(([key, value]) => {
                if (key !== 'type') {
                    cutSettingElement.appendChild(createElement(lbrn2Document, key, { Value: value }));
                }
            });
            projectElement.appendChild(cutSettingElement);
        });
    };

    addVariableText();
    addUIPrefs();
    addCutSettings();

    const addShape = (type, attributes, xFormValues) => {
        const shapeElement = createElement(lbrn2Document, 'Shape', { Type: type, CutIndex: '4', ...attributes });
        shapeElement.appendChild(createElement(lbrn2Document, 'XForm', {}, xFormValues));
        projectElement.appendChild(shapeElement);
    };

    for (const label of labels) {
        const { width, height, first_text_line } = label;

        // Check if we need to move to a new page
        if (currentY + height > maxHeight) {
            currentY = 0;
            if (currentX + columnWidth >= columnThreshold * threshold) {
                currentX += columnSpace;
                threshold += 1;
            }
            currentX += columnWidth;
            columnWidth = 0;
        }

        // Check if we need to start a new SVG file
        if (currentX + width > maxWidth) {
            const lbrn2Filename = `${baseFilename}_${lbrn2Count}.lbrn2`;
            const xmlString = new XMLSerializer().serializeToString(lbrn2Document);
            saveLBRN2(xmlString, lbrn2Filename, folder);
            lbrn2Count++;
            
            // Create a new LightBurn project document
            lbrn2Document = document.implementation.createDocument(null, 'LightBurnProject', null);
            projectElement = lbrn2Document.documentElement;
            projectElement.setAttribute('AppVersion', '1.6.03');
            projectElement.setAttribute('FormatVersion', '1');
            projectElement.setAttribute('MaterialHeight', '0');
            projectElement.setAttribute('MirrorX', 'True');
            projectElement.setAttribute('MirrorY', 'True');
            
            // Re-add initial elements
            addVariableText();
            addUIPrefs();
            addCutSettings();
            
            currentX = 0;
            currentY = 0;
            columnWidth = 0;
            threshold = 1;
        }

        // Add label shapes and text
        addShape('Rect', { W: width.toString(), H: height.toString(), Cr: '0' }, `1 0 0 1 ${currentX + width / 2} ${currentY + height / 2}`);
        
        // Adjust the first text size to fit within the label dimensions
        const adjustedFirstTextSize = fitTextSize(first_text_line, width, height, 0, label.first_text_size || height);
        const textShapeAttributes = {
            Type: 'Text',
            CutIndex: '23',
            Font: 'Arial,-1,100,5,75,0,0,0,0,0',
            H: adjustedFirstTextSize.toString(),
            LS: '0',
            LnS: '0',
            Ah: '1',
            Av: '1',
            Bold: '1',
            Weld: '1',
            HasBackupPath: '1',
            Str: first_text_line
        };
        const mesureText = measureTextSVG(first_text_line, adjustedFirstTextSize)
        console.log(currentX,currentY, mesureText, first_text_line,  width, height );
        const textXFormValues = `1 0 0 1 ${currentX + width / 2} ${currentY + height / 2}`;
        const textElement = createElement(lbrn2Document, 'Shape', textShapeAttributes);
        textElement.appendChild(createElement(lbrn2Document, 'BackupPath', { Type: 'Path', CutIndex: '23' }, textXFormValues));
        textElement.appendChild(createElement(lbrn2Document, 'XForm', {}, textXFormValues));
        projectElement.appendChild(textElement);

        currentY += height;
        columnWidth = Math.max(columnWidth, width);
    }

    // Save the final LBRN2 document
    if (lbrn2Count > 0) {
        const lbrn2Filename = `${baseFilename}_${lbrn2Count}.lbrn2`;
        const xmlString = new XMLSerializer().serializeToString(lbrn2Document);
        saveLBRN2(xmlString, lbrn2Filename, folder);
    }
};



// Helper function to create XML elements
const createElement = (doc, name, attributes = {}, textContent = '') => {
    const element = doc.createElement(name);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
};

// Save .lbrn2 file
export const saveLBRN2 = (xmlString, filename, folder) => {
    const blob = new Blob([xmlString], { type: "application/xml" });
    folder.file(filename, blob);
};