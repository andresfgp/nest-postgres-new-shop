import React, { useRef, useState } from 'react';
import { useFormik } from 'formik';
import { processCSV as processCSVForSVG } from './svgGeneratorUtils';
import { processCSV as processCSVForPDF } from './pdfGeneratorUtils';
import { updateSettings } from './utils';
import './App.css';
import logo from './assets/logo-awa.png'; // Adjust path as necessary
import packageJson from '../package.json'; // Import package.json

const App = () => {
    const [isGeneratingSVG, setIsGeneratingSVG] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const fileInputRef = useRef(null);

    const formik = useFormik({
        initialValues: {
            maxWidth: 600,
            maxHeight: 300,
            numberPagesPerSVG: 3,
            columnSpace: 6,
            file: null
        },
        onSubmit: (values, { setSubmitting }) => {
            updateSettings(values);

            if (values.file) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    if (isGeneratingSVG) {
                        processCSVForSVG(e.target.result, () => {
                            setIsGeneratingSVG(false);
                            setSubmitting(false);
                            console.log("SVG Processing completed");
                        });
                    } else if (isGeneratingPDF) {
                        processCSVForPDF(e.target.result, () => {
                            setIsGeneratingPDF(false);
                            setSubmitting(false);
                            console.log("PDF Processing completed");
                        });
                    }
                };

                reader.onerror = () => {
                    console.error("Error reading the file");
                    setIsGeneratingSVG(false);
                    setIsGeneratingPDF(false);
                    setSubmitting(false);
                    alert('Error reading the file.');
                };

                reader.readAsText(values.file);
            }
        },
        validate: values => {
            const errors = {};
            if (!values.maxWidth) errors.maxWidth = 'Required';
            if (!values.maxHeight) errors.maxHeight = 'Required';
            if (!values.numberPagesPerSVG) errors.numberPagesPerSVG = 'Required';
            if (!values.columnSpace) errors.columnSpace = 'Required';
            if (!values.file) errors.file = 'Required';
            return errors;
        }
    });

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        formik.setFieldValue('file', file);
    };

    const handleReset = () => {
        formik.resetForm();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleGenerateSVG = () => {
        setIsGeneratingSVG(true);
        formik.handleSubmit();
    };

    const handleGeneratePDF = () => {
        setIsGeneratingPDF(true);
        formik.handleSubmit();
    };

    return (
        <div className="App">
            <header className="header">
                <h1>Generator</h1>
                <img src={logo} alt="Logo" />
            </header>
            <div className="main-content">
                <form onSubmit={formik.handleSubmit} className="settings">
                    <label>
                        Max Width (mm):
                        <input
                            type="number"
                            name="maxWidth"
                            value={formik.values.maxWidth}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.maxWidth && formik.errors.maxWidth ? (
                            <div className="error">{formik.errors.maxWidth}</div>
                        ) : null}
                    </label>
                    <label>
                        Max Height (mm):
                        <input
                            type="number"
                            name="maxHeight"
                            value={formik.values.maxHeight}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.maxHeight && formik.errors.maxHeight ? (
                            <div className="error">{formik.errors.maxHeight}</div>
                        ) : null}
                    </label>
                    <label>
                        Pages per SVG:
                        <input
                            type="number"
                            name="numberPagesPerSVG"
                            value={formik.values.numberPagesPerSVG}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.numberPagesPerSVG && formik.errors.numberPagesPerSVG ? (
                            <div className="error">{formik.errors.numberPagesPerSVG}</div>
                        ) : null}
                    </label>
                    <label>
                        Space between pages:
                        <input
                            type="number"
                            name="columnSpace"
                            value={formik.values.columnSpace}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.columnSpace && formik.errors.columnSpace ? (
                            <div className="error">{formik.errors.columnSpace}</div>
                        ) : null}
                    </label>
                    <label>
                        CSV File:
                        <input
                            type="file"
                            name="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            onBlur={formik.handleBlur}
                            ref={fileInputRef}
                        />
                        {formik.touched.file && formik.errors.file ? (
                            <div className="error">{formik.errors.file}</div>
                        ) : null}
                    </label>
                    <div className="buttons">
                        <div>
                            <button 
                                type="button" 
                                disabled={isGeneratingSVG || isGeneratingPDF || formik.isSubmitting} 
                                onClick={handleGenerateSVG} 
                                className="generate-button"
                            >
                                {isGeneratingSVG ? 'Generating SVG...' : 'SVG'}
                            </button>
                            <button 
                                type="button" 
                                disabled={isGeneratingSVG || isGeneratingPDF || formik.isSubmitting} 
                                onClick={handleGeneratePDF} 
                                className="generate-button"
                            >
                                {isGeneratingPDF ? 'Generating PDF...' : 'PDF'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isGeneratingSVG || isGeneratingPDF || formik.isSubmitting}
                            className="reset-button"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
            <footer className="footer">
                <div className="version">Version: {packageJson.version}</div>
            </footer>
        </div>
    );
};

export default App;
